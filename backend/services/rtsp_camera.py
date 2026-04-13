"""
RTSP/HLS Camera Service for connecting to public CCTV streams
Supports RTSP, HLS (m3u8), HTTP streams, and YouTube live streams
"""

import cv2
import asyncio
import threading
import time
from services.detector import ObjectDetector
from typing import Optional, Dict, Any, Generator
import queue
import os
import json
import uuid

# List of REAL publicly available camera streams for crowd detection
# User requested removal of all public cameras to focus on Custom URL feature
PUBLIC_CAMERAS = []

SAVED_CAMERAS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "saved_cameras.json")

class RTSPCameraService:
    """Service for connecting to RTSP/HLS camera streams and processing with YOLO"""
    
    def __init__(self):
        self.detector = ObjectDetector()
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        self.frame_queue: Dict[str, queue.Queue] = {}
        self.stop_events: Dict[str, threading.Event] = {}
        self._ensure_data_file()
        
    def _ensure_data_file(self):
        """Ensure the saved cameras file exists"""
        try:
            if not os.path.exists(os.path.dirname(SAVED_CAMERAS_FILE)):
                os.makedirs(os.path.dirname(SAVED_CAMERAS_FILE))
            if not os.path.exists(SAVED_CAMERAS_FILE):
                with open(SAVED_CAMERAS_FILE, 'w') as f:
                    json.dump([], f)
        except Exception as e:
            print(f"Error initializing data file: {e}")

    def get_saved_cameras(self) -> list:
        """Get list of user-saved cameras"""
        try:
            if os.path.exists(SAVED_CAMERAS_FILE):
                with open(SAVED_CAMERAS_FILE, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            print(f"Error loading saved cameras: {e}")
            return []

    def save_camera(self, camera_data: dict) -> dict:
        """Save a new camera"""
        cameras = self.get_saved_cameras()
        new_cam = {
            "id": str(uuid.uuid4()),
            "name": camera_data.get("name", "Unnamed Camera"),
            "url": camera_data.get("url"),
            "location": camera_data.get("location", "Custom"),
            "type": "custom",
            "description": camera_data.get("description", ""),
            "created_at": time.time()
        }
        cameras.append(new_cam)
        with open(SAVED_CAMERAS_FILE, 'w') as f:
            json.dump(cameras, f, indent=2)
        return new_cam

    def delete_camera(self, camera_id: str) -> bool:
        """Delete a saved camera"""
        cameras = self.get_saved_cameras()
        initial_len = len(cameras)
        cameras = [c for c in cameras if c['id'] != camera_id]
        if len(cameras) != initial_len:
            with open(SAVED_CAMERAS_FILE, 'w') as f:
                json.dump(cameras, f, indent=2)
            return True
        return False

    def update_camera(self, camera_id: str, updates: dict) -> bool:
        """Update a saved camera"""
        cameras = self.get_saved_cameras()
        found = False
        for cam in cameras:
            if cam['id'] == camera_id:
                cam.update(updates)
                found = True
                break
        if found:
            with open(SAVED_CAMERAS_FILE, 'w') as f:
                json.dump(cameras, f, indent=2)
        return True
        
    def get_available_cameras(self) -> list:
        """Return list of available public cameras + saved cameras"""
        saved = self.get_saved_cameras()
        # Add dynamic fields
        all_cameras = PUBLIC_CAMERAS + saved
        return all_cameras
    
    def _get_youtube_stream_url(self, youtube_url: str) -> Optional[str]:
        """
        Extract direct stream URL from YouTube live stream
        Uses yt-dlp - tries multiple format options for compatibility
        """
        import subprocess
        import os
        
        # Get the path to yt-dlp in the venv
        venv_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        yt_dlp_paths = [
            os.path.join(venv_path, 'venv', 'Scripts', 'yt-dlp.exe'),  # Windows venv
            os.path.join(venv_path, 'venv', 'bin', 'yt-dlp'),  # Linux venv
            'yt-dlp',  # System PATH
            'yt-dlp.exe',  # Windows PATH
        ]
        
        yt_dlp_cmd = None
        for path in yt_dlp_paths:
            if os.path.exists(path) or path in ['yt-dlp', 'yt-dlp.exe']:
                yt_dlp_cmd = path
                break
        
        if not yt_dlp_cmd:
            print("[RTSP] yt-dlp not found")
            return None
        
        # Try multiple format options for compatibility
        format_options = [
            'best[height<=480]',  # Best quality up to 480p
            'best[height<=720]',  # Best quality up to 720p
            'worst',  # Worst quality (fastest)
            'best',  # Best available
        ]
        
        for fmt in format_options:
            try:
                print(f"[RTSP] Trying yt-dlp with format: {fmt}")
                result = subprocess.run(
                    [yt_dlp_cmd, '-g', '-f', fmt, '--no-warnings', youtube_url],
                    capture_output=True,
                    text=True,
                    timeout=45
                )
                if result.returncode == 0 and result.stdout.strip():
                    url = result.stdout.strip().split('\n')[0]  # Get first URL if multiple
                    print(f"[RTSP] Got stream URL: {url[:80]}...")
                    return url
                else:
                    if result.stderr:
                        print(f"[RTSP] yt-dlp stderr: {result.stderr[:200]}")
            except subprocess.TimeoutExpired:
                print(f"[RTSP] yt-dlp timed out with format {fmt}")
            except Exception as e:
                print(f"[RTSP] yt-dlp error with format {fmt}: {e}")
        
        print(f"[RTSP] Could not get YouTube stream URL for: {youtube_url}")
        return None

    
    def _resolve_stream_url(self, camera_info: dict) -> str:
        """Resolve the actual stream URL from camera info"""
        url = camera_info["url"]
        
        # Handle numeric webcam index
        if url.isdigit():
            return f"webcam:{url}"
        
        # Handle YouTube URLs
        if "youtube.com" in url or "youtu.be" in url:
            resolved = self._get_youtube_stream_url(url)
            if resolved:
                return resolved
            # Return None if YouTube extraction fails - no demo fallback
            print(f"[RTSP] YouTube stream unavailable: {url}")
            return None
        
        return url
    
    def _capture_thread(self, camera_id: str, camera_info: dict, stop_event: threading.Event):
        """Background thread to capture frames from stream"""
        print(f"[RTSP] Starting capture thread for {camera_id}")
        
        # Initial resolution
        stream_url = self._resolve_stream_url(camera_info)
        if stream_url is None:
             print(f"[RTSP] Stream URL is None for {camera_id} - stream unavailable")
             return

        cap = None
        retry_count = 0
        max_retries = 20  # increased retries for robustness
        
        stream_source = None
        
        while not stop_event.is_set() and retry_count < max_retries:
            # Resolve stream source if needed (e.g. on first run or re-connect)
            if stream_source is None:
                if stream_url.startswith("webcam:"):
                    stream_source = int(stream_url.split(":")[1])
                else:
                    stream_source = stream_url

            try:
                if cap is None or not cap.isOpened():

        
                    source_display = f"webcam {stream_source}" if isinstance(stream_source, int) else str(stream_source)[:60]
                    print(f"[RTSP] Connecting to stream: {source_display}...")

                    # Use appropriate capture method based on source type
                    if isinstance(stream_source, int):
                        cap = cv2.VideoCapture(stream_source)
                    else:
                        # Set environment for HLS streams
                        import os
                        os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = 'rtsp_transport;tcp|analyzeduration;10000000|probesize;10000000'
                        
                        cap = cv2.VideoCapture(stream_source, cv2.CAP_FFMPEG)
                        
                        # Configure for streaming
                        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer for live streaming
                        cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 15000)  # 15 second timeout
                        cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 10000)  # 10 second read timeout
                    
                    if not cap.isOpened():
                        print(f"[RTSP] Failed to open stream, retry {retry_count + 1}/{max_retries}")
                        retry_count += 1
                        time.sleep(3)
                        continue
                    
                    print(f"[RTSP] Connected to stream successfully!")
                    retry_count = 0

                
                ret, frame = cap.read()
                if not ret:
                    print(f"[RTSP] Stream ended or lost frame, attempting reconnect/loop...")
                    cap.release()
                    cap = None
                    
                    # Force re-resolution of URL for YouTube/VODs to enable looping or handling expiration
                    if not str(stream_source).isdigit():
                        stream_source = None
                        
                        # Re-resolve immediately
                        new_url = self._resolve_stream_url(camera_info)
                        if new_url:
                            stream_url = new_url
                        
                    retry_count += 1
                    time.sleep(1)
                    continue
                
                # Resize for performance
                frame = cv2.resize(frame, (640, 480))
                
                # Put frame in queue (drop old frames if queue is full)
                if camera_id in self.frame_queue:
                    try:
                        # Clear old frames
                        while not self.frame_queue[camera_id].empty():
                            try:
                                self.frame_queue[camera_id].get_nowait()
                            except queue.Empty:
                                break
                        self.frame_queue[camera_id].put(frame, timeout=0.1)
                    except queue.Full:
                        pass
                
                # Small delay to control frame rate
                time.sleep(0.05)  # ~20 fps max
                
            except Exception as e:
                print(f"[RTSP] Error in capture thread: {e}")
                if cap:
                    cap.release()
                    cap = None
                retry_count += 1
                time.sleep(2)
        
        if cap:
            cap.release()
        print(f"[RTSP] Capture thread ended for {camera_id}")
    
    def _generate_demo_frames(self, camera_id: str, stop_event: threading.Event):
        """Generate demo frames with synthetic crowd data"""
        import numpy as np
        
        frame_count = 0
        while not stop_event.is_set():
            try:
                # Create a demo frame with gradient
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                
                # Add some visual noise to simulate video
                noise = np.random.randint(20, 40, (480, 640, 3), dtype=np.uint8)
                frame = cv2.add(frame, noise)
                
                # Add timestamp and info
                cv2.putText(frame, f"Demo Mode - Frame {frame_count}", 
                           (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                cv2.putText(frame, "Public CCTV streams require yt-dlp", 
                           (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
                cv2.putText(frame, "Install with: pip install yt-dlp", 
                           (50, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
                
                # Add moving rectangles to simulate people
                num_people = 3 + int(3 * np.sin(frame_count * 0.05))
                for i in range(num_people):
                    x = int(100 + (i * 80) + 30 * np.sin(frame_count * 0.02 + i))
                    y = int(200 + 50 * np.sin(frame_count * 0.03 + i * 0.5))
                    cv2.rectangle(frame, (x, y), (x+40, y+100), (0, 255, 0), 2)
                    cv2.putText(frame, str(i+1), (x+5, y-5), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                
                if camera_id in self.frame_queue:
                    try:
                        while not self.frame_queue[camera_id].empty():
                            try:
                                self.frame_queue[camera_id].get_nowait()
                            except queue.Empty:
                                break
                        self.frame_queue[camera_id].put(frame, timeout=0.1)
                    except queue.Full:
                        pass
                
                frame_count += 1
                time.sleep(0.1)  # 10 fps for demo
                
            except Exception as e:
                print(f"[Demo] Error: {e}")
                time.sleep(1)
    
    def start_stream(self, camera_id: str, custom_url: Optional[str] = None) -> bool:
        """Start capturing from a camera stream"""
        if camera_id in self.active_streams:
            print(f"[RTSP] Stream {camera_id} already active")
            return True
        
        # Find camera info
        camera_info = None
        if custom_url:
            camera_info = {
                "id": camera_id,
                "name": "Custom Stream",
                "url": custom_url,
                "location": "Custom",
                "type": "custom"
            }
        else:

            # Check all available cameras (public + saved)
            all_cams = self.get_available_cameras()
            for cam in all_cams:
                if cam["id"] == camera_id:
                    camera_info = cam
                    break
        
        if not camera_info:
            print(f"[RTSP] Camera {camera_id} not found")
            return False
        
        # Resolve the stream URL
        stream_url = self._resolve_stream_url(camera_info)
        
        if stream_url is None:
            print(f"[RTSP] Failed to resolve stream URL for {camera_id}")
            return False
        
        # Create queue and stop event
        self.frame_queue[camera_id] = queue.Queue(maxsize=5)
        self.stop_events[camera_id] = threading.Event()
        
        # Start capture thread
        thread = threading.Thread(
            target=self._capture_thread,
            args=(camera_id, camera_info, self.stop_events[camera_id]),
            daemon=True
        )
        thread.start()
        
        self.active_streams[camera_id] = {
            "info": camera_info,
            "thread": thread,
            "started_at": time.time()
        }
        
        return True
    
    def stop_stream(self, camera_id: str):
        """Stop a camera stream"""
        if camera_id in self.stop_events:
            self.stop_events[camera_id].set()
        
        if camera_id in self.active_streams:
            del self.active_streams[camera_id]
        
        if camera_id in self.frame_queue:
            del self.frame_queue[camera_id]
        
        if camera_id in self.stop_events:
            del self.stop_events[camera_id]
        
        print(f"[RTSP] Stopped stream {camera_id}")
    
    def stop_all_streams(self):
        """Stop all active streams"""
        for camera_id in list(self.active_streams.keys()):
            self.stop_stream(camera_id)
    
    async def generate_processed_frames(self, camera_id: str):
        """
        Generator that yields processed frames with YOLO detection
        Yields: (frame_bytes, person_count, detections)
        """
        if camera_id not in self.frame_queue:
            print(f"[RTSP] No frame queue for {camera_id}")
            return
        
        frame_queue = self.frame_queue[camera_id]
        
        while camera_id in self.active_streams:
            try:
                # Get frame from queue
                try:
                    frame = frame_queue.get(timeout=0.5)
                except queue.Empty:
                    await asyncio.sleep(0.1)
                    continue
                
                # Process with YOLO
                annotated_frame, count = self.detector.process_frame(frame)
                
                # Encode to JPEG
                ret, buffer = cv2.imencode('.jpg', annotated_frame, 
                                          [cv2.IMWRITE_JPEG_QUALITY, 70])
                frame_bytes = buffer.tobytes()
                
                yield frame_bytes, count
                
                # Control output rate
                await asyncio.sleep(0.05)
                
            except Exception as e:
                print(f"[RTSP] Error processing frame: {e}")
                await asyncio.sleep(0.5)
    
    def get_stream_status(self, camera_id: str) -> Optional[Dict]:
        """Get status of a stream"""
        if camera_id not in self.active_streams:
            return None
        
        stream = self.active_streams[camera_id]
        return {
            "id": camera_id,
            "name": stream["info"]["name"],
            "location": stream["info"]["location"],
            "active": True,
            "uptime": time.time() - stream["started_at"]
        }


# Singleton instance
rtsp_camera_service = RTSPCameraService()
