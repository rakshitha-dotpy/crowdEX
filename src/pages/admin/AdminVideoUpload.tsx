import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle2, Zap, Download, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { uploadVideo, API_BASE_URL, WS_BASE_URL } from '@/lib/api';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface ProcessingStats {
  status: string;
  progress: number;
  people_count: number;
  counts: number[];
  avg_count?: number;
  peak_count?: number;
  min_count?: number;
  frames_processed?: number;
  preview_frame?: string;
}

export default function AdminVideoUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [frameSkip, setFrameSkip] = useState(15);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getSpeedLabel = (skip: number) => {
    if (skip <= 5) return 'Detailed';
    if (skip <= 15) return 'Balanced';
    return 'Fast';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) await handleUpload(e.target.files[0]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) await handleUpload(e.dataTransfer.files[0]);
  };

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('uploading');
    setProgress(0);
    setProcessingTime(0);

    try {
      const response = await uploadVideo(selectedFile, frameSkip);
      setFileId(response.id);
      setStatus('processing');
      timerRef.current = setInterval(() => setProcessingTime(prev => prev + 0.1), 100);
      connectWebSocket(response.id);
    } catch (error) {
      setStatus('error');
    }
  };

  const connectWebSocket = (id: string) => {
    const ws = new WebSocket(`${WS_BASE_URL}/upload/${id}/progress`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'error') {
        setStatus('error');
        if (timerRef.current) clearInterval(timerRef.current);
        ws.close();
      } else if (data.status === 'completed') {
        setStatus('complete');
        setStats(data);
        if (timerRef.current) clearInterval(timerRef.current);
        ws.close();
      } else {
        setStats(data);
        setProgress(data.progress);
      }
    };
  };

  const handleDownloadJSON = async () => {
    if (!fileId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/upload/${fileId}/results`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${fileId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed');
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetUpload = () => {
    setStatus('idle');
    setProgress(0);
    setFile(null);
    setFileId(null);
    setStats(null);
    setProcessingTime(0);
  };

  const avgCount = Math.round(stats?.avg_count ?? (stats?.counts?.length ? stats.counts.reduce((a, b) => a + b, 0) / stats.counts.length : 0));
  const peakCount = stats?.peak_count ?? (stats?.counts?.length ? Math.max(...stats.counts) : 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Video Upload</h1>
        <p className="text-muted-foreground text-sm">Upload videos for crowd analysis</p>
      </div>

      {/* Upload Area */}
      <motion.div
        className={`glass-card p-8 border-2 border-dashed transition-colors ${dragOver ? 'border-primary bg-secondary' : 'border-border'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {status === 'idle' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-muted-foreground" />
            </div>

            <div className="mb-6 p-4 bg-secondary rounded-xl max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Analysis Speed</span>
                </div>
                <span className="text-sm font-medium">{getSpeedLabel(frameSkip)}</span>
              </div>
              <Slider value={[frameSkip]} onValueChange={(v) => setFrameSkip(v[0])} min={1} max={30} step={1} />
              <p className="text-xs text-muted-foreground mt-2">Every {frameSkip} frame{frameSkip > 1 ? 's' : ''}</p>
            </div>

            <div className="relative inline-block">
              <input type="file" accept="video/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Button size="icon" className="w-12 h-12 rounded-xl" title="Select Video">
                <File className="w-6 h-6" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">MP4, AVI, MOV • Max 500MB</p>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-4">{file?.name}</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'uploading' || status === 'processing' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="w-8 h-px bg-border" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'processing' ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-secondary'}`}>
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </div>

            {status === 'processing' && stats && (
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2 aspect-video bg-primary rounded-xl overflow-hidden shadow-2xl">
                  {stats.preview_frame ? (
                    <img src={`data:image/jpeg;base64,${stats.preview_frame}`} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-primary-foreground">
                      <Zap className="w-16 h-16 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 content-start">
                  {[
                    { label: 'Detected', value: stats.people_count },
                    { label: 'Frames', value: stats.frames_processed || 0 },
                    { label: 'Time', value: `${processingTime.toFixed(1)}s` },
                    { label: 'Peak', value: Math.max(...(stats.counts || [0])) }
                  ].map((item) => (
                    <div key={item.label} className="bg-secondary rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Progress value={status === 'processing' ? progress : 100} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{status === 'uploading' ? 'Uploading...' : 'Analyzing...'}</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-crowd-low/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-crowd-low" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analysis Complete</h3>
            <p className="text-sm text-muted-foreground mb-6">Processed in {processingTime.toFixed(1)}s</p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
              {[
                { label: 'Average', value: avgCount },
                { label: 'Peak', value: peakCount },
                { label: 'Frames', value: stats?.frames_processed || 0 }
              ].map((item) => (
                <div key={item.label} className="bg-secondary rounded-xl p-4">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={resetUpload}>New Upload</Button>
              <Button onClick={handleDownloadJSON}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <p className="text-destructive mb-4">Upload failed. Please try again.</p>
            <Button variant="outline" onClick={resetUpload}>Try Again</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
