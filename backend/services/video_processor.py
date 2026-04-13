import cv2
import os
import asyncio
import uuid
import base64
from services.detector import ObjectDetector

class VideoProcessor:
    def __init__(self, upload_dir="uploads"):
        self.upload_dir = upload_dir
        self.detector = ObjectDetector()
        os.makedirs(self.upload_dir, exist_ok=True)
        self.active_processings = {}  # id -> status dict

    async def save_upload(self, file_content, filename):
        file_id = str(uuid.uuid4())
        path = os.path.join(self.upload_dir, f"{file_id}_{filename}")
        with open(path, "wb") as f:
            f.write(file_content)
        print(f"Video saved to: {path}, Size: {os.path.getsize(path)} bytes")
        return file_id, path

    async def process_video(self, file_id, file_path, frame_skip=15):
        """Process video with YOLOv8 person detection - REAL detection, no mock data.
        
        Args:
            file_id: Unique identifier for this upload
            file_path: Path to the video file
            frame_skip: Process every Nth frame (1=all frames, higher=faster)
        """
        self.active_processings[file_id] = {
            "status": "processing",
            "progress": 0,
            "current_count": 0,
            "counts": [],
            "frames_processed": 0,
            "total_frames": 0,
            "filename": os.path.basename(file_path),
            "preview_frame": None,  # Base64 encoded frame for live preview
            "frame_skip": frame_skip  # Store for display
        }
        
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            print(f"Error: Could not open video file at {file_path}")
            self.active_processings[file_id]["status"] = "error"
            self.active_processings[file_id]["error"] = "Could not open video file"
            return
            
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        self.active_processings[file_id]["total_frames"] = total_frames
        self.active_processings[file_id]["fps"] = fps
        self.active_processings[file_id]["duration"] = total_frames / fps if fps > 0 else 0
        
        frame_idx = 0
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every Nth frame for FAST processing
                if frame_idx % frame_skip == 0:
                    # Resize to SMALL size for faster detection (320x240 instead of 640x480)
                    frame_resized = cv2.resize(frame, (320, 240))
                    annotated_frame, count = self.detector.process_frame(frame_resized)
                    
                    # Encode frame as base64 JPEG for live preview
                    _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    self.active_processings[file_id]["current_count"] = count
                    self.active_processings[file_id]["counts"].append(count)
                    self.active_processings[file_id]["frames_processed"] += 1
                    self.active_processings[file_id]["preview_frame"] = frame_base64
                    progress = int((frame_idx / max(total_frames, 1)) * 100)
                    self.active_processings[file_id]["progress"] = min(progress, 99)
                    
                    # Track which second this frame belongs to
                    video_second = int(frame_idx / fps) if fps > 0 else 0
                    if "counts_per_second" not in self.active_processings[file_id]:
                        self.active_processings[file_id]["counts_per_second"] = {}
                    
                    sec_key = str(video_second)
                    if sec_key not in self.active_processings[file_id]["counts_per_second"]:
                        self.active_processings[file_id]["counts_per_second"][sec_key] = []
                    self.active_processings[file_id]["counts_per_second"][sec_key].append(count)
                    
                    # Minimal sleep to yield control
                    await asyncio.sleep(0.001)
                
                frame_idx += 1
            
            # Calculate final stats
            counts = self.active_processings[file_id]["counts"]
            if counts:
                self.active_processings[file_id]["avg_count"] = round(sum(counts) / len(counts), 1)
                self.active_processings[file_id]["peak_count"] = max(counts)
                self.active_processings[file_id]["min_count"] = min(counts)
            else:
                self.active_processings[file_id]["avg_count"] = 0
                self.active_processings[file_id]["peak_count"] = 0
                self.active_processings[file_id]["min_count"] = 0
            
            # Aggregate counts per second (average for each second)
            counts_per_sec = self.active_processings[file_id].get("counts_per_second", {})
            timeline_per_second = []
            for sec in sorted(counts_per_sec.keys(), key=lambda x: int(x)):
                sec_counts = counts_per_sec[sec]
                avg = round(sum(sec_counts) / len(sec_counts), 1) if sec_counts else 0
                timeline_per_second.append({"second": int(sec), "avg_count": avg, "max_count": max(sec_counts) if sec_counts else 0})
            self.active_processings[file_id]["timeline_per_second"] = timeline_per_second
            
            # Clear preview on completion to save memory
            self.active_processings[file_id]["preview_frame"] = None
            self.active_processings[file_id]["status"] = "completed"
            self.active_processings[file_id]["progress"] = 100

            # SAVE RESULTS TO JSON
            results = self._generate_results_dict(file_id)
            json_path = os.path.join(self.upload_dir, f"{file_id}.json")
            import json
            with open(json_path, "w") as f:
                json.dump(results, f)
            
            # Release video capture before deleting file (Critical for Windows)
            cap.release()

            # DELETE VIDEO FILE TO SAVE SPACE
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Deleted video file: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete video file {file_path}: {e}")
            
        except Exception as e:
            print(f"Error processing video {file_id}: {e}")
            self.active_processings[file_id]["status"] = "error"
            self.active_processings[file_id]["error"] = str(e)
        finally:
            cap.release()
            
    def get_status(self, file_id):
        # 1. Check active memory
        status = self.active_processings.get(file_id)
        if status:
            return {k: v for k, v in status.items() if k != "latest_frame"}
        
        # 2. Check saved JSON
        json_path = os.path.join(self.upload_dir, f"{file_id}.json")
        if os.path.exists(json_path):
            try:
                import json
                with open(json_path, "r") as f:
                    data = json.load(f)
                return {
                    "status": "completed",
                    "progress": 100,
                    "avg_count": data["statistics"]["average_count"],
                    "peak_count": data["statistics"]["peak_count"],
                    "min_count": data["statistics"]["minimum_count"],
                    "counts": data["counts_timeline"],
                    "timeline_per_second": data.get("timeline_per_second", []) # Assuming added to _generate_results_dict
                }
            except:
                pass

        return None
    
    def _generate_results_dict(self, file_id):
        status = self.active_processings.get(file_id)
        if not status: return None
        
        counts = status.get("counts", [])
        return {
            "file_id": file_id,
            "filename": status.get("filename", "unknown"),
            "status": "completed",
            "duration_seconds": status.get("duration", 0),
            "fps": status.get("fps", 0),
            "total_frames": status.get("total_frames", 0),
            "frames_analyzed": status.get("frames_processed", 0),
            "statistics": {
                "average_count": status.get("avg_count", 0),
                "peak_count": status.get("peak_count", 0),
                "minimum_count": status.get("min_count", 0),
                "data_points": len(counts)
            },
            "counts_timeline": counts,
            "timeline_per_second": status.get("timeline_per_second", [])
        }

    def get_results_json(self, file_id):
        """Get detailed results for JSON export."""
        # 1. Try memory
        res = self._generate_results_dict(file_id)
        if res and res["status"] == "completed":
            return res
            
        # 2. Try disk
        json_path = os.path.join(self.upload_dir, f"{file_id}.json")
        if os.path.exists(json_path):
            import json
            with open(json_path, "r") as f:
                return json.load(f)

        return None

# Initialize with path from env or relative to project root
_env_upload_dir = os.getenv("UPLOAD_DIR")
if _env_upload_dir:
    _uploads_path = _env_upload_dir
else:
    # Fallback to calculated path
    _project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    _uploads_path = os.path.join(_project_root, "uploads")

video_processor = VideoProcessor(upload_dir=_uploads_path)

