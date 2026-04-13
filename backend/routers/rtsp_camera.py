"""
RTSP Camera Router - Endpoints for public CCTV stream access and YOLO detection
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from services.rtsp_camera import rtsp_camera_service, PUBLIC_CAMERAS
from pydantic import BaseModel
from typing import Optional
import asyncio

router = APIRouter(prefix="/api/rtsp", tags=["rtsp-camera"])


class StartStreamRequest(BaseModel):
    camera_id: Optional[str] = None
    custom_url: Optional[str] = None


class CreateCameraRequest(BaseModel):
    name: str
    url: str
    location: Optional[str] = "Custom"
    description: Optional[str] = ""

class UpdateCameraRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None


@router.get("/cameras")
async def get_available_cameras():
    """Get list of available public CCTV cameras"""
    cameras = []
    # Get all cameras (public + saved)
    all_cams = rtsp_camera_service.get_available_cameras()
    
    for cam in all_cams:
        # Check if stream is active
        status = rtsp_camera_service.get_stream_status(cam["id"])
        cameras.append({
            **cam,
            "is_active": status is not None,
            "uptime": status["uptime"] if status else 0
        })
    return {"cameras": cameras}


@router.post("/saved")
async def save_camera(request: CreateCameraRequest):
    """Save a new custom camera"""
    return rtsp_camera_service.save_camera(request.dict())


@router.delete("/saved/{camera_id}")
async def delete_camera(camera_id: str):
    """Delete a saved camera"""
    success = rtsp_camera_service.delete_camera(camera_id)
    if not success:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"status": "deleted", "id": camera_id}


@router.put("/saved/{camera_id}")
async def update_camera(camera_id: str, request: UpdateCameraRequest):
    """Update a saved camera"""
    success = rtsp_camera_service.update_camera(camera_id, request.dict(exclude_unset=True))
    if not success:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"status": "updated", "id": camera_id}


@router.post("/stream/start")
async def start_stream(request: StartStreamRequest):
    """Start a camera stream"""
    camera_id = request.camera_id or "custom"
    
    if not request.camera_id and not request.custom_url:
        raise HTTPException(status_code=400, detail="Either camera_id or custom_url is required")
    
    success = rtsp_camera_service.start_stream(
        camera_id=camera_id,
        custom_url=request.custom_url
    )
    
    if success:
        return {"status": "started", "camera_id": camera_id}
    else:
        raise HTTPException(status_code=500, detail="Failed to start stream")


@router.post("/stream/stop/{camera_id}")
async def stop_stream(camera_id: str):
    """Stop a camera stream"""
    rtsp_camera_service.stop_stream(camera_id)
    return {"status": "stopped", "camera_id": camera_id}


@router.get("/stream/status/{camera_id}")
async def get_stream_status(camera_id: str):
    """Get status of a stream"""
    status = rtsp_camera_service.get_stream_status(camera_id)
    if status:
        return status
    else:
        return {"id": camera_id, "active": False}


@router.websocket("/ws/stream/{camera_id}")
async def websocket_rtsp_stream(websocket: WebSocket, camera_id: str):
    """
    WebSocket endpoint for receiving live CCTV stream with YOLO detection
    Sends: binary JPEG frames alternating with JSON detection data
    """
    await websocket.accept()
    print(f"[WS] Client connected for camera: {camera_id}")
    
    # Start stream if not already active
    # Check if it's a known camera (saved or public) or needs custom URL logic (which should be handled by start_stream mostly)
    # If it is a saved camera that hasn't started, we try to start it.
    
    if not rtsp_camera_service.get_stream_status(camera_id):
        # We try simple start. If it logic requires a custom URL not in the saved/public list, 
        # it would have failed before reaching here usually, or we need to pass URL.
        # But for saved cameras, the service knows the URL.
        rtsp_camera_service.start_stream(camera_id)
    
    # Wait a bit for stream to initialize
    await asyncio.sleep(1)
    
    try:
        async for frame_bytes, count in rtsp_camera_service.generate_processed_frames(camera_id):
            try:
                # Send frame as binary
                await websocket.send_bytes(frame_bytes)
                
                # Send detection data as JSON
                await websocket.send_json({
                    "count": count,
                    "camera_id": camera_id,
                    "timestamp": asyncio.get_event_loop().time()
                })
            except Exception as e:
                print(f"[WS] Send error: {e}")
                break
                
    except WebSocketDisconnect:
        print(f"[WS] Client disconnected from camera: {camera_id}")
    except Exception as e:
        print(f"[WS] Error in RTSP stream: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass
