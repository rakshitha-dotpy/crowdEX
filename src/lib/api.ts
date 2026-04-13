// Use environment variable if available, otherwise fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, "");

export const API_BASE_URL = `${CLEAN_BASE_URL}/api`;
export const WS_BASE_URL = `${CLEAN_BASE_URL.replace(/^http/, "ws")}/ws`;

export async function uploadVideo(file: File, frameSkip: number = 15): Promise<{ id: string; status: string; frame_skip: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload/video?frame_skip=${frameSkip}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Upload failed");
    }

    return response.json();
}

export async function getVideoStatus(fileId: string) {
    const response = await fetch(`${API_BASE_URL}/upload/${fileId}/status`);
    if (!response.ok) {
        throw new Error("Failed to get status");
    }
    return response.json();
}
