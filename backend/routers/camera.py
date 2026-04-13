from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.camera import CameraService
import asyncio

router = APIRouter()
camera_service = CameraService(0)  # Default webcam

@router.websocket("/ws/camera/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Just stream counts
        async for frame_bytes, count in camera_service.generate_frames():
            await websocket.send_json({"count": count})
    except WebSocketDisconnect:
        camera_service.stop()
    except Exception as e:
        print(f"WS Error: {e}")
        try:
             await websocket.close()
        except:
            pass

@router.websocket("/ws/camera/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Stream frame + count
        async for frame_bytes, count in camera_service.generate_frames():
            await websocket.send_bytes(frame_bytes)
            # You might want to send metadata too, but sending bytes is for video mainly.
            # Alternating messages or a text protocol could work.
            # For simplicity, if client expects video, just bytes. 
            # If client expects data, use the other endpoint.
            # BUT, client might want visualization.
            # Let's assume this is for the visual feed.
            pass
    except WebSocketDisconnect:
        camera_service.stop()
    except Exception as e:
        print(f"WS Error: {e}")
        try:
             await websocket.close()
        except:
             pass
