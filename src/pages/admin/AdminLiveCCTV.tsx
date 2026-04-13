import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video,
    Play,
    Pause,
    Maximize2,
    Users,
    Radio,
    Wifi,
    WifiOff,
    Globe,
    MapPin,
    Camera,
    Activity,
    Zap,
    RefreshCw,
    ExternalLink,
    Settings,
    ChevronRight,
    Circle,
    AlertCircle,
    CheckCircle2,
    Plus,
    Trash2,
    Edit2,
    Save,
    X
} from 'lucide-react';
import { cn as clsxMerge } from '@/lib/utils';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import { API_BASE_URL, WS_BASE_URL } from '@/lib/api';

// Camera types for icons
const cameraTypeIcons: Record<string, React.ReactNode> = {
    crowd: <Users className="w-4 h-4" />,
    local: <Camera className="w-4 h-4" />,
    custom: <Globe className="w-4 h-4" />
};

interface PublicCamera {
    id: string;
    name: string;
    location: string;
    url: string;
    type: string;
    description: string;
    is_active: boolean;
    uptime: number;
}

interface StreamStats {
    count: number;
    maxCount: number;
    avgCount: number;
    history: number[];
    startTime: number;
}

export default function AdminLiveCCTV() {
    const [cameras, setCameras] = useState<PublicCamera[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<PublicCamera | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentCount, setCurrentCount] = useState(0);
    const [streamStats, setStreamStats] = useState<StreamStats>({
        count: 0,
        maxCount: 0,
        avgCount: 0,
        history: [],
        startTime: 0
    });
    const [customUrl, setCustomUrl] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedName, setSavedName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Save or Update Camera
    const handleSaveCamera = async () => {
        if (!customUrl.trim() || !savedName.trim()) return;

        setIsSaving(true);
        try {
            const endpoint = editingId
                ? `${API_BASE_URL}/rtsp/saved/${editingId}`
                : `${API_BASE_URL}/rtsp/saved`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: savedName,
                    url: customUrl,
                    location: 'Custom',
                    description: 'User saved stream'
                })
            });

            if (response.ok) {
                setSavedName('');
                setCustomUrl('');
                setEditingId(null);
                fetchCameras(); // Refresh list
            }
        } catch (err) {
            console.error('Failed to save camera:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Camera
    const handleDeleteCamera = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this stream?')) return;

        try {
            await fetch(`${API_BASE_URL}/rtsp/saved/${id}`, {
                method: 'DELETE'
            });
            fetchCameras();

            if (selectedCamera?.id === id) {
                disconnectCamera();
            }
        } catch (err) {
            console.error('Failed to delete camera:', err);
        }
    };

    // Edit Camera
    const handleEditCamera = (cam: PublicCamera) => {
        setSavedName(cam.name);
        setCustomUrl(cam.url);
        setEditingId(cam.id);
        setShowCustomInput(true);
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch available cameras
    const fetchCameras = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/rtsp/cameras`);
            const data = await response.json();
            setCameras(data.cameras || []);
        } catch (err) {
            console.error('Failed to fetch cameras:', err);
        }
    }, []);

    useEffect(() => {
        console.log('Admin Live CCTV Module Loaded - Version Check');
        fetchCameras();

        // Refresh camera list every 30s
        const interval = setInterval(fetchCameras, 30000);
        return () => clearInterval(interval);
    }, [fetchCameras]);

    // Connect to camera stream
    const connectToCamera = useCallback(async (camera: PublicCamera) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        setIsConnecting(true);
        setError(null);
        setSelectedCamera(camera);
        setStreamStats({
            count: 0,
            maxCount: 0,
            avgCount: 0,
            history: [],
            startTime: Date.now()
        });

        // Start the stream via API first
        try {
            const response = await fetch(`${API_BASE_URL}/rtsp/stream/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    camera_id: camera.id,
                    custom_url: camera.id === 'custom' ? camera.url : undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start stream');
            }
        } catch (err) {
            console.error('Failed to start stream:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to stream');
            setIsConnecting(false);
            setIsConnected(false);
            return;
        }

        // Wait for stream to initialize (YouTube streams take longer)
        const isYouTube = camera.url?.includes('youtube.com') || camera.url?.includes('youtu.be');
        await new Promise(resolve => setTimeout(resolve, isYouTube ? 8000 : 3000));

        // Connect WebSocket
        const ws = new WebSocket(`${WS_BASE_URL.replace('/ws', '')}/api/rtsp/ws/stream/${camera.id}`);
        wsRef.current = ws;
        ws.binaryType = 'arraybuffer';

        let pendingData = false;

        ws.onopen = () => {
            setIsConnected(true);
            setIsConnecting(false);
        };

        ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                // JSON detection data
                try {
                    const data = JSON.parse(event.data);
                    if (data.count !== undefined) {
                        setCurrentCount(data.count);
                        setStreamStats(prev => {
                            const newHistory = [...prev.history, data.count].slice(-60); // Keep last 60 readings
                            const sum = newHistory.reduce((a, b) => a + b, 0);
                            return {
                                ...prev,
                                count: data.count,
                                maxCount: Math.max(prev.maxCount, data.count),
                                avgCount: Math.round(sum / newHistory.length),
                                history: newHistory
                            };
                        });
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            } else {
                // Binary frame data
                const blob = new Blob([event.data], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        }
                    }
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            setIsConnecting(false);
        };

        ws.onerror = (e) => {
            console.error('WebSocket error:', e);
            setError('Connection error. Please try again.');
            setIsConnected(false);
            setIsConnecting(false);
        };
    }, []);

    // Disconnect from camera
    const disconnectCamera = useCallback(async () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (selectedCamera) {
            try {
                await fetch(`${API_BASE_URL}/rtsp/stream/stop/${selectedCamera.id}`, {
                    method: 'POST'
                });
            } catch (err) {
                console.error('Failed to stop stream:', err);
            }
        }

        setIsConnected(false);
        setSelectedCamera(null);
        setCurrentCount(0);
    }, [selectedCamera]);

    // Connect to custom URL
    const connectToCustomUrl = useCallback(async () => {
        if (!customUrl.trim()) return;

        const customCamera: PublicCamera = {
            id: 'custom',
            name: 'Custom Stream',
            location: 'Custom URL',
            url: customUrl,
            type: 'custom',
            description: 'User-provided stream URL',
            is_active: false,
            uptime: 0
        };

        connectToCamera(customCamera);
        setShowCustomInput(false);
    }, [customUrl, connectToCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
        };
    }, []);

    // Calculate crowd level
    const getCrowdLevel = (count: number): { level: string; color: string; bgColor: string } => {
        if (count < 5) return { level: 'Low', color: 'text-green-500', bgColor: 'bg-green-500/20' };
        if (count < 15) return { level: 'Moderate', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
        if (count < 30) return { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
        return { level: 'Very High', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    };

    const crowdInfo = getCrowdLevel(currentCount);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/50">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        Surveillance Control
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        Live CCTV Analysis
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {cameras.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center">
                                <Video className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                        ))}
                        {cameras.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-background bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                                +{cameras.length - 3}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchCameras}
                        className="rounded-full hover:bg-primary/5"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Column: Video Feed & Primary Stats */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Main Video Player */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative glass-card overflow-hidden bg-black border-zinc-800 shadow-2xl">
                            {/* Video Header / Toolbar */}
                            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                                <div className="flex flex-col gap-2 pointer-events-auto">
                                    <div className={clsxMerge(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-md border border-white/10",
                                        isConnected ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-zinc-900/50 text-zinc-400"
                                    )}>
                                        <div className={clsxMerge(
                                            "w-1.5 h-1.5 rounded-full",
                                            isConnected ? "bg-red-500 animate-pulse" : "bg-zinc-500"
                                        )} />
                                        {isConnected ? 'SIGNAL ACTIVE' : isConnecting ? 'SYNCHRONIZING...' : 'NO SOURCE'}
                                    </div>

                                    {selectedCamera && (
                                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3">
                                            <h3 className="text-white font-bold text-sm">{selectedCamera.name}</h3>
                                            <p className="text-white/60 text-[10px] uppercase tracking-tight">{selectedCamera.location}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedCamera && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={disconnectCamera}
                                        className="pointer-events-auto bg-black/20 hover:bg-red-500/20 text-white/70 hover:text-red-500 border border-white/5 backdrop-blur-md transition-all rounded-full h-8 px-4"
                                    >
                                        Disconnect
                                    </Button>
                                )}
                            </div>

                            {/* Canvas Wrapper */}
                            <div className="relative aspect-video w-full flex items-center justify-center bg-zinc-950">
                                {selectedCamera ? (
                                    <>
                                        <canvas
                                            ref={canvasRef}
                                            width={640}
                                            height={480}
                                            className="w-full h-full object-contain"
                                        />

                                        {isConnecting && (
                                            <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center">
                                                <div className="relative w-16 h-16">
                                                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                                <p className="text-white font-medium mt-6 tracking-wide">ESTABLISHING UPLINK</p>
                                                <p className="text-zinc-500 text-[10px] mt-2 font-mono">
                                                    {selectedCamera?.url?.includes('youtube') ? 'DECODING YOUTUBE STREAM...' : 'CONNECTING TO RTSP HOST...'}
                                                </p>
                                            </div>
                                        )}

                                        {isConnected && (
                                            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
                                                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl pointer-events-auto flex items-center gap-4">
                                                    <div className="p-3 bg-primary/20 rounded-xl">
                                                        <Users className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Live Occupancy</div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
                                                                <CountUp end={currentCount} duration={0.3} preserveValue />
                                                            </span>
                                                            <span className="text-xs text-zinc-500 font-medium tracking-tight">PERSONS</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={clsxMerge(
                                                    "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-xl border pointer-events-auto",
                                                    crowdInfo.bgColor, crowdInfo.color, "border-white/5"
                                                )}>
                                                    {crowdInfo.level} Density
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-zinc-600 group/empty">
                                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 group-hover/empty:scale-110 transition-transform duration-500">
                                            <Video className="w-8 h-8 opacity-20" />
                                        </div>
                                        <h3 className="text-zinc-400 font-bold tracking-wide">NO ACTIVE STREAM</h3>
                                        <p className="text-zinc-600 text-[11px] mt-2 uppercase tracking-widest">Select a channel from the directory</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Telemetry Stats */}
                    {isConnected && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Peak Data', value: streamStats.maxCount, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                { label: 'Average', value: streamStats.avgCount, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Signal Uptime', value: `${Math.floor((Date.now() - streamStats.startTime) / 1000)}s`, icon: Radio, color: 'text-green-500', bg: 'bg-green-500/10' },
                                { label: 'Processing', value: '30 FPS', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card p-4 flex items-center gap-4 border-border/50 bg-white/40"
                                >
                                    <div className={clsxMerge("p-2 rounded-lg", stat.bg)}>
                                        <stat.icon className={clsxMerge("w-4 h-4", stat.color)} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                                        <div className="text-lg font-bold tracking-tight">
                                            {typeof stat.value === 'number' ? <CountUp end={stat.value} duration={1} /> : stat.value}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* History Chart */}
                    {isConnected && streamStats.history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-6 border-border/50 bg-white/40"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" />
                                    Detection Timeline History
                                </h3>
                                <div className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded uppercase">Live Feed Updates</div>
                            </div>
                            <div className="h-32 flex items-end gap-1 px-1">
                                {streamStats.history.map((count, i) => {
                                    const height = streamStats.maxCount > 0 ? (count / streamStats.maxCount) * 100 : 0;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-sm transition-all duration-300 relative group/bar"
                                            style={{
                                                height: `${Math.max(height, 4)}%`,
                                                backgroundColor: count < 5 ? 'hsl(var(--crowd-low))' :
                                                    count < 15 ? 'hsl(var(--crowd-medium))' :
                                                        'hsl(var(--crowd-high))'
                                            }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                {count} ppl
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-4 border-t border-border/50">
                                <span>60 Seconds Ago</span>
                                <span>Real-time Output</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Source Controls & Directory */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Add/Edit Form */}
                    <div className="glass-card p-6 border-zinc-200 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                        <div className="relative">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                                    {editingId ? <Settings className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                </div>
                                {editingId ? 'Modify Channel' : 'Register New Channel'}
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Channel Label</label>
                                    <input
                                        type="text"
                                        value={savedName}
                                        onChange={(e) => setSavedName(e.target.value)}
                                        placeholder="Name your stream..."
                                        className="w-full h-11 px-4 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stream Endpoint (RTSP/HLS/YT)</label>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                            placeholder="URL Source..."
                                            className="w-full h-11 pl-11 pr-4 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={handleSaveCamera}
                                        disabled={!customUrl.trim() || !savedName.trim() || isSaving}
                                        className="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : editingId ? 'Update Signal' : 'Save Channel'}
                                    </Button>
                                    {editingId && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingId(null);
                                                setSavedName('');
                                                setCustomUrl('');
                                            }}
                                            className="h-11 rounded-xl px-4"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Directory / Saved Streams */}
                    <div className="glass-card p-6 border-zinc-200 shadow-xl min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <div className="p-1.5 bg-secondary text-foreground rounded-lg">
                                    <Globe className="w-3.5 h-3.5" />
                                </div>
                                Signal Directory
                            </h3>
                            <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{cameras.length} CH</span>
                        </div>

                        <div className="space-y-3 custom-scrollbar max-h-[500px] overflow-y-auto pr-2">
                            {cameras.length > 0 ? (
                                cameras.map((cam) => (
                                    <div
                                        key={cam.id}
                                        className={clsxMerge(
                                            "group p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                                            selectedCamera?.id === cam.id
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                                : "bg-white/50 border-border hover:border-primary/30 hover:shadow-md hover:bg-white"
                                        )}
                                    >
                                        <div className="relative z-10 flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h4 className={clsxMerge("font-extrabold text-sm truncate uppercase tracking-tight", selectedCamera?.id === cam.id ? "text-white" : "text-zinc-900")}>
                                                    {cam.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={clsxMerge("text-[10px] font-medium opacity-60 flex items-center gap-1", selectedCamera?.id === cam.id ? "text-white" : "text-zinc-500")}>
                                                        {cameraTypeIcons[cam.type] || <Camera className="w-3 h-3" />}
                                                        {cam.type.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant={selectedCamera?.id === cam.id ? "secondary" : "ghost"}
                                                    className={clsxMerge("h-9 w-9 rounded-xl transition-all", selectedCamera?.id === cam.id ? "bg-white/10 text-white hover:bg-white/20" : "hover:bg-primary/5")}
                                                    onClick={() => connectToCamera(cam)}
                                                    disabled={isConnecting}
                                                >
                                                    {selectedCamera?.id === cam.id ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 fill-current" />}
                                                </Button>

                                                <div className={clsxMerge("w-px h-6 mx-1 opacity-20", selectedCamera?.id === cam.id ? "bg-white" : "bg-border")} />

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={clsxMerge("h-9 w-9 rounded-xl", selectedCamera?.id === cam.id ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                                    onClick={() => handleEditCamera(cam)}
                                                    disabled={selectedCamera?.id === cam.id}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={clsxMerge("h-9 w-9 rounded-xl", selectedCamera?.id === cam.id ? "text-white/60" : "text-muted-foreground hover:text-red-500")}
                                                    onClick={() => handleDeleteCamera(cam.id)}
                                                    disabled={selectedCamera?.id === cam.id}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {selectedCamera?.id === cam.id && (
                                            <motion.div
                                                layoutId="active-indicator"
                                                className="absolute bottom-0 left-0 h-1 bg-white"
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                            />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-2xl">
                                    <Globe className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No signals configured</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


