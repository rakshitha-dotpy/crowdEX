# NovaWatch Analytics (NovaWatch)

**NovaWatch Analytics** is a state-of-the-art Real-Time Public Crowd Awareness System designed specifically for the bustling city of Metropolis. It empowers citizens and tourists with live crowd data, enabling them to make informed decisions about visiting popular public locations such as malls, beaches, parks, and transit hubs.

> **Tagline:** *"Know Before You Go"*

---

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Project Overview

In a densely populated city like Metropolis, overcrowding at public places is a common challenge. **NovaWatch Analytics** addresses this by providing a dual-interface application:

1.  **Public Interface:** A user-friendly, map-based interface for the general public to view real-time crowd status, "best visit times," and historical trends.
2.  **Admin Interface:** A robust dashboard for authorities and administrators to manage camera feeds, analyze video data, and oversee the system's data inputs.

The system leverages **Computer Vision (YOLOv8)** to analyze video feeds in real-time, converting visual data into actionable crowd metrics.

---

## ✨ Key Features

### 🌍 For Public Users
*   **Interactive Map:** A dynamic Leaflet-based map displaying key locations across Metropolis with custom markers indicating crowd density.
*   **Real-Time Status:** Instant visual cues (Green/Yellow/Red) representing Low, Medium, and High crowd levels.
*   **Smart Recommendations:** Algorithm-driven "Best Time to Visit" suggestions based on historical and current data.
*   **Data Visualization:** Interactive charts showing popular times and crowd trends using Recharts.
*   **Search Functionality:** easy-to-use search bar to find specific malls, parks, or beaches.

### 🛡️ For Administrators
*   **Dashboard:** specialized view for managing the system's core data.
*   **Live Camera Management:** Tools to add, remove, and monitor simulated or real CCTV feeds.
*   **Video Analysis:** Upload interface for processing recorded footage through the YOLOv8 engine to extract crowd data.
*   **System Health:** Monitoring of backend services and WebSocket connections.

---

## 🏗️ Architecture

The application follows a modern **Client-Server architecture**:

*   **Frontend:** A Single Page Application (SPA) built with React and TypeScript, communicating with the backend via REST APIs and WebSockets.
*   **Backend:** A high-performance FastAPI server that handles API requests, manages WebSocket connections for real-time updates, and runs the YOLOv8 inference engine.
*   **Vision Engine:** Ultralytics YOLOv8 model optimized for person detection, processing video frames to count individuals.

---

## 🛠️ Technology Stack

### Frontend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | React 18 (Vite) | Fast, modern web application framework. |
| **Language** | TypeScript | Type-safe JavaScript for robust code. |
| **UI Library** | Shadcn UI | Accessible and customizable component primitives. |
| **Styling** | Tailwind CSS | Utility-first CSS framework for rapid UI development. |
| **Maps** | React Leaflet | React components for Leaflet maps. |
| **State Mgmt** | React Query | Powerful data synchronization and caching. |
| **Animations** | Framer Motion | Production-ready animation library. |
| **Charts** | Recharts | Composable charting library. |
| **Notifications** | Sonner | Sleek toast notifications. |
| **Validation** | Zod & Hook Form | Schema-driven form management. |

### Backend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | FastAPI | High-performance Python web framework. |
| **Language** | Python 3.9+ | Primary backend language. |
| **Vision Model** | YOLOv8 | State-of-the-art object detection model. |
| **Vision** | OpenCV | Library for real-time computer vision. |
| **Real-time** | WebSockets | Full-duplex communication channels. |
| **Stream Extraction**| yt-dlp | High-performance YouTube stream handling. |
| **File Handling** | python-multipart| Support for video file uploads. |

---

## ⚡ Getting Started

Follow these steps to set up the project locally.

### Prerequisites
Ensure you have the following installed on your system:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python](https://www.python.org/) (v3.9 or higher)
*   [Git](https://git-scm.com/)

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/novawatch.git
cd novawatch
```

#### 2. Backend Setup
Navigate to the backend folder and set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup
Open a new terminal, navigate to the project root, and install dependencies.

```bash
# Ensure you are in the root directory (Metropolis-crowd-watch)
npm install
```

### Running the Application

**Option 1: Quick Start (Batch Script)**
If you are on Windows, you can use the provided batch file to start both services:
```bash
./run_backend.bat
```
*(Note: You made need to manually start the frontend server in a separate terminal if the batch file only targets the backend)*

**Option 2: Manual Start**

1.  **Start Backend:**
    ```bash
    cd backend
    # Ensure venv is active
    uvicorn main:app --reload --port 8000
    ```

2.  **Start Frontend:**
    ```bash
    # From project root
    npm run dev
    ```

The frontend will run at `http://localhost:8080` (or similar), and the backend API will typically be at `http://localhost:8000`.

---

## 📖 API Documentation

The backend exposes several endpoints. Once the server is running, you can visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Key Endpoints:
*   `GET /api/locations`: Retrieve all location data.
*   `POST /api/upload`: Upload video files for analysis.
*   `GET /api/camera`: List available camera feeds.
*   `WS /ws/camera/{camera_id}`: WebSocket endpoint for live camera streams.
*   `WS /ws/upload/{file_id}/progress`: WebSocket endpoint for video processing status.

---

## 🤝 Contributing

We welcome contributions to improve NovaWatch Analytics!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
