# 🤖 NovaWatch BACKEND PROMPT: Python FastAPI with YOLOv8 Detection

## Your Mission

Build and maintain the **NovaWatch Backend** – a FastAPI-powered Python server that provides:
1. **YOLOv8 Person Detection** for live camera feeds and uploaded videos
2. **RTSP/HLS Camera Streaming** with support for public cameras and custom URLs
3. **Mock Location Data** for 15 Metropolis locations
4. **WebSocket Streaming** for real-time updates

---

## 🏗️ PROJECT STRUCTURE

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container deployment
├── yolov8n.pt              # YOLOv8 nano model weights
├── data/
│   ├── mock_data.py        # Metropolis locations & crowd simulation
│   └── saved_cameras.json  # Persisted custom cameras
├── routers/
│   ├── locations.py        # Location CRUD endpoints
│   ├── camera.py           # Local webcam endpoints
│   ├── rtsp_camera.py      # RTSP/HLS streaming endpoints
│   └── upload.py           # Video upload endpoints
└── services/
    ├── detector.py         # YOLOv8 singleton detector
    ├── camera.py           # Local webcam service
    ├── rtsp_camera.py      # RTSP/HLS camera service
    └── video_processor.py  # Video upload processing
```

---

## 🔧 CORE SERVICES

### 1. Object Detector (`services/detector.py`)

**Singleton YOLOv8 detector that auto-loads the model:**

```python
class ObjectDetector:
    """Singleton YOLOv8 person detector"""
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def _load_model(self):
        """Lazy load YOLOv8 model"""
        if self._model is None:
            self._model = YOLO("yolov8n.pt")
    
    def detect_people(self, frame) -> Tuple[np.ndarray, int]:
        """Detect people in frame, return annotated frame and count"""
        self._load_model()
        results = self._model(frame, classes=[0], verbose=False)  # class 0 = person
        annotated_frame = results[0].plot()
        count = len(results[0].boxes)
        return annotated_frame, count
    
    def process_frame(self, frame) -> Tuple[np.ndarray, int]:
        """Wrapper for detect_people"""
        return self.detect_people(frame)
```

**Key Features:**
- Singleton pattern ensures model loads once
- Filters to class 0 (person) only
- Returns annotated frame with bounding boxes + count
- Uses YOLOv8 nano for speed

---

### 2. RTSP Camera Service (`services/rtsp_camera.py`)

**Supports multiple stream types:**
- RTSP streams
- HLS (m3u8) streams
- HTTP streams
- YouTube Live streams (via yt-dlp)

```python
class RTSPCameraService:
    """Service for RTSP/HLS camera streams with YOLO detection"""
    
    def __init__(self):
        self.detector = ObjectDetector()
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        self._ensure_data_file()
    
    # Camera CRUD
    def get_saved_cameras(self) -> List[dict]
    def save_camera(self, camera_data: dict) -> dict
    def delete_camera(self, camera_id: str) -> bool
    def update_camera(self, camera_id: str, updates: dict) -> bool
    def get_available_cameras(self) -> List[dict]
    
    # Stream management
    def start_stream(self, camera_id: str, custom_url: Optional[str] = None) -> bool
    def stop_stream(self, camera_id: str)
    def stop_all_streams(self)
    def get_stream_status(self, camera_id: str) -> Optional[dict]
    
    # Frame generation
    async def generate_processed_frames(self, camera_id: str):
        """Yields: (frame_bytes, person_count)"""
```

**Camera Data Persistence:**
- Saved to `data/saved_cameras.json`
- Each camera has: id, name, url, location, description, type

**YouTube Live Support:**
```python
def _get_youtube_stream_url(self, youtube_url: str) -> Optional[str]:
    """Extract direct stream URL using yt-dlp"""
    # Tries multiple format options for compatibility
    # Returns direct HLS URL for OpenCV consumption
```

---

### 3. Video Processor (`services/video_processor.py`)

**Process uploaded videos with YOLO detection:**

```python
class VideoProcessor:
    def __init__(self, upload_dir="uploads"):
        self.upload_dir = upload_dir
        self.detector = ObjectDetector()
        self.active_processings = {}  # id -> status dict
    
    async def save_upload(self, file_content, filename) -> Tuple[str, str]:
        """Save uploaded file, return (file_id, file_path)"""
    
    async def process_video(self, file_id, file_path, frame_skip=15):
        """Process video with YOLO detection
        
        Args:
            file_id: Unique identifier
            file_path: Path to video file
            frame_skip: Process every Nth frame (higher = faster)
        """
    
    def get_status(self, file_id) -> Optional[dict]:
        """Get processing status (from memory or saved JSON)"""
    
    def get_results_json(self, file_id) -> Optional[dict]:
        """Get detailed results for export"""
```

**Processing Features:**
- Frame skip for speed (1 = all frames, 60 = fastest)
- Real-time progress updates via WebSocket
- Live preview frames (base64 encoded)
- Per-second count aggregation
- Auto-delete video after processing (save space)
- Results saved to JSON for persistence

**Status Object:**
```python
{
    "status": "processing" | "completed" | "error",
    "progress": 0-100,
    "current_count": int,
    "counts": [int, ...],
    "frames_processed": int,
    "total_frames": int,
    "preview_frame": "base64...",  # Live preview
    "avg_count": float,
    "peak_count": int,
    "min_count": int,
    "timeline_per_second": [{"second": int, "avg_count": float, "max_count": int}, ...]
}
```

---

### 4. Mock Data (`data/mock_data.py`)

**15 Metropolis Locations with crowd simulation:**

```python
LOCATIONS = [
    # MALLS (4)
    {"id": "loc_001", "name": "Express Avenue Mall", "type": "mall", 
     "address": "Whites Road, Royapettah", "lat": 13.0604, "lng": 80.2627, "capacity": 5000},
    {"id": "loc_002", "name": "Phoenix MarketCity", ...},
    {"id": "loc_003", "name": "VR Metropolis", ...},
    {"id": "loc_004", "name": "Forum Vijaya Mall", ...},
    
    # BEACHES (2)
    {"id": "loc_005", "name": "Marina Beach", "type": "beach", "capacity": 50000, ...},
    {"id": "loc_006", "name": "Besant Nagar Beach", ...},
    
    # PARKS (2)
    {"id": "loc_007", "name": "Guindy National Park", "type": "park", ...},
    {"id": "loc_008", "name": "Semmozhi Poonga", ...},
    
    # TRANSIT (3)
    {"id": "loc_009", "name": "Metropolis Central Station", "type": "transit", ...},
    {"id": "loc_010", "name": "Metropolis Egmore Station", ...},
    {"id": "loc_011", "name": "CMBT Bus Terminus", ...},
    
    # MARKETS (2)
    {"id": "loc_012", "name": "T. Nagar Ranganathan Street", "type": "market", ...},
    {"id": "loc_013", "name": "Pondy Bazaar", ...},
    
    # ATTRACTIONS (2)
    {"id": "loc_014", "name": "Government Museum", "type": "attraction", ...},
    {"id": "loc_015", "name": "Valluvar Kottam", ...}
]
```

**Crowd Patterns by Type:**
```python
CROWD_PATTERNS = {
    "mall": {"weekday": [...24 hourly values...], "weekend": [...]},
    "beach": {"weekday": [...], "weekend": [...]},
    "park": {"weekday": [...], "weekend": [...]},
    "transit": {"weekday": [...], "weekend": [...]},
    "market": {"weekday": [...], "weekend": [...]},
    "attraction": {"weekday": [...], "weekend": [...]}
}
```

**Functions:**
```python
def get_all_locations() -> List[Dict]:
    """Get all locations with current crowd status"""
    # Returns: id, name, type, address, lat, lng, current_count, capacity,
    #          crowd_level, crowd_percentage, trend, trend_change, last_updated

def get_location_by_id(location_id: str) -> Optional[Dict]:
    """Get detailed location with popular times and best times"""
    # Additional fields: today_stats, popular_times, best_times, avoid_times, hourly_data

def generate_popular_times(location_id: str) -> List[Dict]:
    """Generate 6AM-11PM popular times data"""

def get_best_times(location_id: str) -> Dict:
    """Get best/avoid time recommendations"""
```

---

## 🌐 API ENDPOINTS

### Main App (`main.py`)

```python
app = FastAPI(title="NovaWatch Backend", version="1.0.0")

# CORS - Allow all origins for hackathon
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

# Routers
app.include_router(locations.router)      # /api/locations/*
app.include_router(upload.router)         # /api/upload/*
app.include_router(camera.router)         # /api/camera/*, /ws/camera/*
app.include_router(rtsp_router)           # /api/rtsp/*, /ws/rtsp/*

# Root endpoints
@app.get("/")                             # API info
@app.get("/api/health")                   # Health check

# WebSocket for upload progress
@app.websocket("/ws/upload/{file_id}/progress")
```

---

### Location Endpoints (`routers/locations.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all locations with optional `?type=` filter |
| GET | `/api/locations/{id}` | Get detailed location by ID |

**Response format for list:**
```json
{
    "locations": [...],
    "total": 15,
    "timestamp": "2026-01-31T06:00:00Z"
}
```

---

### Camera Endpoints (`routers/camera.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/camera/status` | Check if camera is available |
| GET | `/api/camera/frame` | Get single frame with detection |

| WebSocket | Endpoint | Description |
|-----------|----------|-------------|
| WS | `/ws/camera/live` | Live count streaming (JSON only) |
| WS | `/ws/camera/stream` | Live video streaming with detection |

---

### RTSP Camera Endpoints (`routers/rtsp_camera.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rtsp/cameras` | List all cameras (public + saved) |
| POST | `/api/rtsp/saved` | Save a new custom camera |
| PUT | `/api/rtsp/saved/{id}` | Update a saved camera |
| DELETE | `/api/rtsp/saved/{id}` | Delete a saved camera |
| POST | `/api/rtsp/stream/start` | Start a camera stream |
| POST | `/api/rtsp/stream/stop/{id}` | Stop a camera stream |
| GET | `/api/rtsp/stream/status/{id}` | Get stream status |

| WebSocket | Endpoint | Description |
|-----------|----------|-------------|
| WS | `/ws/rtsp/stream/{camera_id}` | Live stream with YOLO detection |

**WebSocket Data Flow:**
1. Binary: JPEG frame bytes
2. JSON: `{"count": int, "camera_id": str, "timestamp": float}`

**Create Camera Request:**
```python
class CreateCameraRequest(BaseModel):
    name: str
    url: str
    location: Optional[str] = "Custom"
    description: Optional[str] = ""
```

---

### Upload Endpoints (`routers/upload.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/video?frame_skip={n}` | Upload video for processing |
| GET | `/api/upload/{id}/status` | Get processing status |
| DELETE | `/api/upload/{id}` | Delete upload |

| WebSocket | Endpoint | Description |
|-----------|----------|-------------|
| WS | `/ws/upload/{file_id}/progress` | Real-time processing progress |

**Upload Response:**
```json
{
    "id": "uuid",
    "status": "processing",
    "frame_skip": 15
}
```

**Progress WebSocket Data:**
```json
{
    "status": "processing",
    "progress": 45,
    "current_count": 23,
    "preview_frame": "base64...",
    "frames_processed": 450,
    "total_frames": 1000
}
```

---

## 📋 REQUIREMENTS

```txt
fastapi
uvicorn[standard]
opencv-python
ultralytics
python-multipart
```

**Optional for YouTube streams:**
```txt
yt-dlp
```

---

## 🚀 RUNNING THE SERVER

### Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows
source venv/bin/activate        # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Production (Docker)
```bash
docker build -t NovaWatch-backend .
docker run -p 8000:8000 NovaWatch-backend
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `UPLOAD_DIR` | Directory for video uploads | `../uploads` |

---

## 🧪 TESTING

### Health Check
```bash
curl http://localhost:8000/api/health
# {"status": "healthy"}
```

### List Locations
```bash
curl http://localhost:8000/api/locations
# {"locations": [...], "total": 15, "timestamp": "..."}
```

### Filter by Type
```bash
curl http://localhost:8000/api/locations?type=mall
# {"locations": [4 malls...], "total": 4, ...}
```

### Upload Video
```bash
curl -X POST -F "file=@video.mp4" "http://localhost:8000/api/upload/video?frame_skip=30"
# {"id": "uuid", "status": "processing", "frame_skip": 30}
```

### WebSocket Test (Python)
```python
import asyncio
import websockets

async def test_camera():
    async with websockets.connect("ws://localhost:8000/ws/rtsp/stream/cam_001") as ws:
        async for message in ws:
            if isinstance(message, bytes):
                print(f"Received frame: {len(message)} bytes")
            else:
                print(f"Detection data: {message}")
```

---

## 🎯 KEY FEATURES SUMMARY

1. **YOLOv8 Person Detection** - Singleton pattern, auto-loading, class 0 filter
2. **Multiple Stream Support** - RTSP, HLS, HTTP, YouTube Live
3. **Custom Camera CRUD** - Save, edit, delete cameras to JSON
4. **Video Processing** - Frame skip, live preview, JSON export
5. **WebSocket Streaming** - Real-time frames + detection data
6. **Mock Location Data** - 15 Metropolis locations with realistic patterns
7. **Time-Based Patterns** - Weekday/weekend, hourly crowd simulation

---

## ⚠️ IMPORTANT NOTES

1. **Model File**: Ensure `yolov8n.pt` is in the backend directory
2. **CORS**: Currently allows all origins (`*`) for hackathon
3. **Video Cleanup**: Videos are auto-deleted after processing
4. **Saved Cameras**: Persisted to `data/saved_cameras.json`
5. **Frame Skip**: Higher values = faster processing, less accuracy

---

**ENHANCE THE BACKEND. Keep it fast. Keep it reliable. Keep it detecting!** 🚀

---

*Document updated: January 31, 2026*
*Reflects current production backend structure*
