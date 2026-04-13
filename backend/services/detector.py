from ultralytics import YOLO
import threading
import cv2
import numpy as np
import os

class ObjectDetector:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ObjectDetector, cls).__new__(cls)
                    # Load a pretrained YOLOv8n model
                    # Try multiple paths for the model file
                    model_paths = [
                        "yolov8n.pt",  # Current directory
                        "../yolov8n.pt",  # Parent directory (when run from backend)
                        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "yolov8n.pt"),  # Project root
                    ]
                    
                    model_path = "yolov8n.pt"  # Default, will auto-download if not found
                    for path in model_paths:
                        if os.path.exists(path):
                            model_path = path
                            print(f"[YOLO] Loading model from: {os.path.abspath(path)}")
                            break
                    else:
                        print("[YOLO] Model not found locally, will download automatically")
                    
                    cls._instance.model = YOLO(model_path)
        return cls._instance

    def process_frame(self, frame, line_thickness=1, conf_threshold=0.25):
        """
        Process a single frame: detect persons, draw THIN boxes with person numbers, and return count + processed frame.
        
        Args:
            frame: Input frame
            line_thickness: Thickness of bounding box lines (default 1 for thin lines)
            conf_threshold: Minimum confidence threshold for detection (default 0.25 for better accuracy)
        """
        # Run YOLO with optimized settings for person detection
        results = self.model(
            frame, 
            classes=[0],  # class 0 is person
            verbose=False,
            conf=conf_threshold,  # Lower threshold to catch more people
            iou=0.45,  # IOU threshold for NMS
            max_det=100,  # Max detections per frame
            agnostic_nms=True,  # Class-agnostic NMS for better results
        )
        
        # Create a copy of the frame for annotation
        annotated_frame = frame.copy()
        
        # Draw thin bounding boxes manually
        boxes = results[0].boxes
        person_count = len(boxes)
        
        # Sort boxes by x-coordinate (left to right) for consistent numbering
        box_list = []
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            box_list.append((x1, y1, x2, y2, conf))
        
        # Sort by x1 (left to right ordering)
        box_list.sort(key=lambda b: b[0])
        
        for person_num, (x1, y1, x2, y2, conf) in enumerate(box_list, start=1):
            # Color: green for high confidence, yellow for medium, orange for low
            if conf > 0.7:
                color = (0, 255, 0)  # Green
            elif conf > 0.5:
                color = (0, 255, 255)  # Yellow
            else:
                color = (0, 165, 255)  # Orange
            
            # Draw thin rectangle
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, line_thickness)
            
            # Draw person number label (1, 2, 3, ...)
            label = str(person_num)
            font_scale = 0.5
            font_thickness = 1
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
            
            # Label background
            cv2.rectangle(annotated_frame, (x1, y1 - label_h - 6), (x1 + label_w + 6, y1), color, -1)
            # Label text (person number)
            cv2.putText(annotated_frame, label, (x1 + 3, y1 - 3), 
                       cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), font_thickness)
        
        return annotated_frame, person_count


