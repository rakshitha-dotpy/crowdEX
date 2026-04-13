from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse
from services.video_processor import video_processor
import asyncio

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/video")
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    frame_skip: int = Query(default=15, ge=1, le=60, description="Process every Nth frame (1=all, 30=fast)")
):
    try:
        content = await file.read()
        file_id, path = await video_processor.save_upload(content, file.filename)
        
        # Start processing in background with frame_skip setting
        background_tasks.add_task(video_processor.process_video, file_id, path, frame_skip)
        
        return {"id": file_id, "status": "processing_started", "frame_skip": frame_skip}
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}/status")
async def get_status(file_id: str):
    status = video_processor.get_status(file_id)
    if not status:
        return {"status": "not_found"}
    return status

@router.get("/{file_id}/results")
async def get_results(file_id: str):
    """Get detailed analysis results for download as JSON."""
    results = video_processor.get_results_json(file_id)
    if not results:
        raise HTTPException(status_code=404, detail="Results not found or processing not complete")
    return JSONResponse(
        content=results,
        headers={
            "Content-Disposition": f'attachment; filename="analysis_{file_id}.json"'
        }
    )

