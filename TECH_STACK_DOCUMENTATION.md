# 📘 NovaWatch Technical Stack Documentation

This document provides a deep dive into the technologies, libraries, and architectural decisions powering **NovaWatch** (NovaWatch Analytics). It is designed to help developers and judges understand the "how" behind the application.

---

## 🏗️ High-Level Architecture

NovaWatch operates as a modern **Client-Server application** with a heavy focus on real-time data and automated computer vision processing.

*   **Frontend (Client):** A Single Page Application (SPA) built with React that handles all user interaction, data visualization, and map rendering.
*   **Backend (Server):** A high-performance Python server that manages APIs, handles long-running WebSocket connections for video streams, and runs the vision inference engine.
*   **Communication:**
    *   **REST API:** For static data (location lists, historical stats).
    *   **WebSockets:** For real-time, low-latency video streaming and live people-counting updates.

---

## 🎨 Frontend Stack (User Interface)

The frontend is built for speed logic and visual impact.

### 1. Core Framework
*   **[React 18](https://react.dev/):** The UI library used for building component-based interfaces.
    *   *Why:* Allows for a modular codebase (`Navbar`, `Map`, `StatsCard` are separate components) and efficient state management.
*   **[Vite](https://vitejs.dev/):** The build tool and development server.
    *   *Why:* Provides near-instant hot module replacement (HMR) during development and highly optimized production builds.
*   **[TypeScript](https://www.typescriptlang.org/):** Adds static typing to JavaScript.
    *   *Why:* Prevents common bugs (like accessing properties on undefined objects) and provides excellent autocomplete in VS Code.

### 2. Styling & Design System
*   **[Tailwind CSS](https://tailwindcss.com/):** A utility-first CSS framework.
    *   *Why:* Speeds up styling by using classes like `flex`, `p-4`, `text-center` instead of writing custom CSS files.
*   **Custom Glassmorphism (CSS Variables):**
    *   *Implementation:* Defined in `index.css` using explicit CSS variables (`--glass-bg`, `--glass-border`).
    *   *Why:* Creates the "Premium" frosted-glass aesthetic that makes the app stand out visually.
*   **[Lucide React](https://lucide.dev/):** Icon library.
    *   *Why:* Provides clean, consistent, and lightweight vector icons (SVG).
*   **[Shadcn UI](https://ui.shadcn.com/):** Component library built on Radix UI.
    *   *Why:* Accessible, pre-styled components that ensure a consistent "premium" look and feel across the admin dashboard and public views.
*   **[React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/):** Form handling and schema validation.
    *   *Why:* Ensures data integrity when registering new spatial nodes or uploading video files.

### 3. State Management & Data Fetching
*   **[@tanstack/react-query](https://tanstack.com/query/latest):** Handles server state (API calls).
    *   *Why:* It automatically caches API responses and handles "Loading" and "Error" states automatically.
*   **[Sonner](https://sonner.emilkowal.ski/):** Toast notification library.
    *   *Why:* Provides sleek, high-performance feedback for user actions like successful registration or upload errors.

### 4. Visualization & Maps
*   **[React Leaflet](https://react-leaflet.js.org/):** The interactive map component.
    *   *Why:* A React wrapper around Leaflet.js. It allows us to render the OpenStreetMap tiles and plot custom markers (the pulsing colored dots) based on latitude/longitude coordinates.
*   **[Recharts](https://recharts.org/):** Data visualization library (used for generic charts).
    *   *Why:* Composable and responsive charting library built specifically for React components.

### 5. Animation
*   **[Framer Motion](https://www.framer.com/motion/):** A production-ready animation library.
    *   *Why:* Powers the smooth page transitions (`<AnimatePresence>`) and the complex entrance animations of cards. It handles the math for "spring" and "ease-out" physics automatically.

---

## ⚙️ Backend Stack (Intelligence Engine)

The backend is the brain of NovaWatch, handling the heavy lifting of computer vision.

### 1. Core Server
*   **[FastAPI](https://fastapi.tiangolo.com/):** A modern, fast (high-performance) web framework for building APIs with Python.
    *   *Why:* It is one of the fastest Python frameworks available (comparable to NodeJS) and natively supports **Asynchronous** programming (`async/await`), which is crucial for handling multiple camera streams simultaneously without blocking.
*   **[Uvicorn](https://www.uvicorn.org/):** The ASGI web server implementation.
    *   *Why:* Runs the FastAPI application, handling the raw HTTP and WebSocket network connections.

### 2. Computer Vision & Automated Detection
*   **[YOLOv8 (Ultralytics)](https://docs.ultralytics.com/):** "You Only Look Once" - State-of-the-art Object Detection model.
    *   *Why:* It is incredibly fast and accurate. We use the `yolov8n.pt` (Nano) model, which is optimized to run on standard laptops/CPUs while still detecting people accurately in real-time.
    *   *Implementation:* Configured in `services/detector.py` to filter specifically for `class=0` (Person) and ignore all other objects like cars or dogs.
*   **[OpenCV (cv2)](https://opencv.org/):** Open Source Computer Vision Library.
    *   *Why:* Used for image manipulation—reading video frames, resizing images for performance, drawing bounding boxes, and encoding images into bytes to send over the network.
*   **[NumPy](https://numpy.org/):** Fundamental package for scientific computing.
    *   *Why:* Used internally by OpenCV to handle image data as efficient multi-dimensional arrays (matrices).
*   **[yt-dlp](https://github.com/yt-dlp/yt-dlp):** Command-line media downloader and stream extractor.
    *   *Why:* Allows the system to ingest live YouTube streams (like public CCTV feeds) for real-time crowd analysis.
*   **[Python-Multipart](https://andrew-d.github.io/python-multipart/):** Support for `multipart/form-data`.
    *   *Why:* Enables the backend to handle large video file uploads for offline detection analysis.

### 3. Real-Time Streaming
*   **WebSockets:** Standard protocol for two-way communication.
    *   *Why:* Unlike standard HTTP requests (where the client asks and the server answers), WebSockets keep a channel open. This allows the backend to "push" new video frames and crowd counts to the frontend 30 times a second.

---

## 🛠️ Key Technical Concepts for the Pitch

If judges ask "How does X work?", use these technical concepts:

### ⚡ Edge Vision Processing
Instead of sending massive video files to a cloud server (which is slow and expensive), NovaWatch performs **Edge Inference**. The python backend running locally processes the video frame-by-frame, extracts the *metadata* (count: 45 people), and only sends that light data or the processed frame to the frontend. This ensures privacy and speed.

### 🔄 Asynchronous Concurrency
The backend uses Python's `asyncio`. This means the server can:
1.  Receive a frame from Camera A.
2.  While the engine is thinking about Camera A, the server can accept a request for "Marina Beach History."
3.  Then go back to sending the result for Camera A.
This non-blocking architecture allows the app to stay feels snappy even when processing video.

### 🎨 Component Composition (Frontend)
The frontend is not a monolithic file. It uses **Atomic Design principles**. Small components (like a `Badge` or `Icon`) are combined to make `Cards`, which are combined to make `Sections`, which form `Pages`. This makes the code highly maintainable and readable.
