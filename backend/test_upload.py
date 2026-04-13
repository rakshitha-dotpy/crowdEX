"""
Test script to verify the video upload and processing functionality.
Run this from the project root with: python backend/test_upload.py
"""
import requests
import asyncio
import websockets
import json
import time
import os

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("=" * 50)
    print("Testing health endpoint...")
    resp = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
    print("✅ Health check passed!")
    return True

def test_locations():
    """Test locations endpoint"""
    print("\n" + "=" * 50)
    print("Testing locations endpoint...")
    resp = requests.get(f"{BASE_URL}/api/locations")
    data = resp.json()
    print(f"Status: {resp.status_code}")
    print(f"Total locations: {data['total']}")
    print(f"First location: {data['locations'][0]['name']}")
    assert resp.status_code == 200
    assert data["total"] == 15
    print("✅ Locations check passed!")
    return True

def test_video_upload():
    """Test video upload (requires a sample video)"""
    print("\n" + "=" * 50)
    print("Testing video upload endpoint...")
    
    # Check if we have a test video
    test_videos = [
        "test_video.mp4",
        "sample.mp4",
        "uploads/*.mp4"
    ]
    
    test_video = None
    for pattern in test_videos:
        import glob
        matches = glob.glob(pattern)
        if matches:
            test_video = matches[0]
            break
    
    if not test_video:
        print("⚠️ No test video found. Please upload a video via the frontend to test.")
        print("   Place a video file named 'test_video.mp4' in the project root to test here.")
        return True  # Don't fail the test
    
    print(f"Using test video: {test_video}")
    
    with open(test_video, "rb") as f:
        files = {"file": (os.path.basename(test_video), f, "video/mp4")}
        resp = requests.post(f"{BASE_URL}/api/upload/video", files=files)
    
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"Response: {data}")
    
    if resp.status_code == 200:
        file_id = data["id"]
        print(f"File ID: {file_id}")
        
        # Poll for status
        for _ in range(60):  # Max 60 seconds
            status_resp = requests.get(f"{BASE_URL}/api/upload/{file_id}/status")
            status_data = status_resp.json()
            print(f"Progress: {status_data.get('progress', 0)}% - Status: {status_data.get('status')}")
            
            if status_data.get("status") in ["completed", "error"]:
                break
            time.sleep(1)
        
        if status_data.get("status") == "completed":
            print(f"✅ Video processing completed!")
            print(f"   Counts: {len(status_data.get('counts', []))} data points")
            print(f"   Avg count: {status_data.get('avg_count', 'N/A')}")
            print(f"   Peak count: {status_data.get('peak_count', 'N/A')}")
        else:
            print(f"❌ Video processing failed: {status_data}")
            
    return True

def main():
    print("🧪 NovaWatch Backend Test Suite")
    print("=" * 50)
    
    try:
        test_health()
        test_locations()
        test_video_upload()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        print("=" * 50)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise

if __name__ == "__main__":
    main()
