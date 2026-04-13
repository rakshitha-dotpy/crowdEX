import cv2
import asyncio
from services.detector import ObjectDetector

class CameraService:
    def __init__(self, source=0):
        self.source = source
        self.detector = ObjectDetector()
        self.cap = None

    def start(self):
        if self.cap is None:
            self.cap = cv2.VideoCapture(self.source)

    def stop(self):
        if self.cap:
            self.cap.release()
            self.cap = None

    async def generate_frames(self):
        self.start()
        if not self.cap or not self.cap.isOpened():
            print("Could not open camera")
            return

        try:
            while True:
                success, frame = self.cap.read()
                if not success:
                    break
                
                # Resize for performance
                frame = cv2.resize(frame, (640, 480))

                annotated_frame, count = self.detector.process_frame(frame)
                
                # Encode
                ret, buffer = cv2.imencode('.jpg', annotated_frame)
                frame_bytes = buffer.tobytes()
                
                yield frame_bytes, count
                
                # approximate 30 fps
                await asyncio.sleep(0.03)
        except Exception as e:
            print(f"Error in camera stream: {e}")
        finally:
            self.stop()
