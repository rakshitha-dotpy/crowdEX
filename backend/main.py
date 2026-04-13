from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import locations, camera, upload
from routers.rtsp_camera import router as rtsp_router
import asyncio
from services.video_processor import video_processor
from fastapi import WebSocket, WebSocketDisconnect

app = FastAPI(title="NovaWatch Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(locations.router)
app.include_router(upload.router)
app.include_router(camera.router) # Camera router has /ws/camera/* paths defined directly
app.include_router(rtsp_router)  # RTSP/Public CCTV camera router

@app.get("/")
def read_root():
    return {"message": "NovaWatch Backend API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.websocket("/ws/upload/{file_id}/progress")
async def upload_progress_ws(websocket: WebSocket, file_id: str):
    await websocket.accept()
    try:
        while True:
            # We need to access the store in video_processor
            status = video_processor.get_status(file_id)
            if not status:
                await websocket.send_json({"error": "not found"})
                # Wait a bit, maybe it's just starting
                await asyncio.sleep(1)
                continue
                
            await websocket.send_json(status)
            
            if status["status"] in ["completed", "error"]:
                break
                
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
