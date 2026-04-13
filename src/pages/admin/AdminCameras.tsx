import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Maximize2, Users, Wifi, WifiOff } from 'lucide-react';
import CountUp from 'react-countup';
import { MetropolisLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { WS_BASE_URL } from '@/lib/api';

const cameras = MetropolisLocations.slice(0, 6).map((loc, i) => ({
  id: `cam-${i + 1}`,
  location: loc.name,
  status: Math.random() > 0.1 ? 'online' : 'offline',
  currentCount: Math.floor(Math.random() * 500) + 100,
  crowdLevel: loc.crowdLevel,
}));

export default function AdminCameras() {
  const [liveCount, setLiveCount] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/camera/stream`);
    wsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => setIsLiveConnected(true);

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        const blob = new Blob([event.data], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    };

    ws.onclose = () => setIsLiveConnected(false);

    const countWs = new WebSocket(`${WS_BASE_URL}/camera/live`);
    countWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.count !== undefined) setLiveCount(data.count);
      } catch (e) {}
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      countWs.close();
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cameras</h1>
          <p className="text-muted-foreground text-sm">Live camera feeds and detection</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-crowd-low/10 text-crowd-low px-3 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-crowd-low animate-pulse" />
            {cameras.filter(c => c.status === 'online').length + (isLiveConnected ? 1 : 0)} Online
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2 glass-card p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Local Camera</h2>
            <span className="text-sm text-muted-foreground">localhost:8080</span>
          </div>

          <div className="relative aspect-video bg-primary rounded-xl overflow-hidden">
            {isLiveConnected ? (
              <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-primary-foreground">
                  <Wifi className="w-10 h-10 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Connecting...</p>
                </div>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-crowd-high animate-pulse' : 'bg-muted-foreground'}`} />
              {isLiveConnected ? 'Live' : 'Offline'}
            </div>

            <div className="absolute bottom-3 left-3 bg-card px-4 py-2 rounded-xl flex items-center gap-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-semibold">{liveCount}</span>
            </div>

            <Button size="icon" variant="secondary" className="absolute bottom-3 right-3 rounded-xl">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="font-semibold mb-4">Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'Active Cameras', value: cameras.filter(c => c.status === 'online').length + 1 },
              { label: 'Total Detected', value: cameras.reduce((acc, c) => acc + (c.status === 'online' ? c.currentCount : 0), 0) + liveCount },
              { label: 'Confidence', value: isLiveConnected ? '98.4%' : '0%' }
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Camera Grid */}
      <div>
        <h2 className="font-semibold mb-4">Remote Cameras</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera, index) => (
            <motion.div
              key={camera.id}
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="relative aspect-video bg-secondary flex items-center justify-center">
                {camera.status === 'online' ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                    <Play className="w-10 h-10 text-primary-foreground fill-current relative z-10" />
                    <div className="absolute top-2 left-2 z-10">
                      <CrowdBadge level={camera.crowdLevel} size="sm" showPulse={false} />
                    </div>
                    <div className="absolute bottom-2 right-2 z-10 bg-card px-2 py-1 rounded-lg flex items-center gap-1.5 text-sm">
                      <Users className="w-3 h-3" />
                      <CountUp end={camera.currentCount} duration={1} />
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-center">
                    <WifiOff className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {camera.status === 'online' ? (
                    <Wifi className="w-4 h-4 text-crowd-low" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-destructive" />
                  )}
                  <span className="font-medium text-sm truncate">{camera.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
