import { motion } from 'framer-motion';
import { MapPin, Video, Users, Bell, TrendingUp, Plus, Upload, FileText } from 'lucide-react';
import CountUp from 'react-countup';
import { MetropolisLocations } from '@/data/mockLocations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const recentActivity = [
  { id: 1, location: 'Marina Beach', event: 'High capacity reached', time: '2 min ago', type: 'alert' },
  { id: 2, location: 'Express Avenue', event: 'Trend rising', time: '5 min ago', type: 'trend' },
  { id: 3, location: 'T. Nagar', event: 'Capacity updated', time: '12 min ago', type: 'update' },
  { id: 4, location: 'Metropolis Central', event: 'New camera added', time: '25 min ago', type: 'camera' },
  { id: 5, location: 'Phoenix Mall', event: 'Dropped to moderate', time: '32 min ago', type: 'alert' },
];

import { AdminPage } from '../AdminPanel';

interface AdminDashboardProps {
  onNavigate: (page: AdminPage) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const totalLocations = MetropolisLocations.length;
  const activeCameras = 42;
  const avgCrowdLevel = 65;
  const alertsToday = 12;

  const highCount = MetropolisLocations.filter(l => l.crowdLevel === 'high').length;
  const mediumCount = MetropolisLocations.filter(l => l.crowdLevel === 'medium').length;
  const lowCount = MetropolisLocations.filter(l => l.crowdLevel === 'low').length;

  const stats = [
    { label: 'Locations', value: totalLocations, icon: MapPin },
    { label: 'Cameras', value: activeCameras, icon: Video },
    { label: 'Avg Load', value: avgCrowdLevel, suffix: '%', icon: Users },
    { label: 'Alerts', value: alertsToday, icon: Bell },
  ];

  const quickActions: { label: string; icon: any; action: AdminPage }[] = [
    { label: 'Add Location', icon: Plus, action: 'locations' },
    { label: 'Upload Video', icon: Upload, action: 'upload' },
    { label: 'View Cameras', icon: Video, action: 'live-cctv' },
    { label: 'Reports', icon: FileText, action: 'analytics' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">System overview and quick actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Real-time</Button>
          <Button variant="secondary" size="sm">Historical</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold tabular-nums">
                <CountUp end={stat.value} duration={1} />
              </span>
              {stat.suffix && <span className="text-muted-foreground">{stat.suffix}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.div
          className="lg:col-span-2 glass-card p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-crowd-low animate-pulse" />
              Live
            </div>
          </div>
          <ScrollArea className="h-[360px]">
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activity.type === 'alert' ? 'bg-crowd-high/10 text-crowd-high' :
                    activity.type === 'trend' ? 'bg-crowd-medium/10 text-crowd-medium' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                    {activity.type === 'alert' ? <Bell className="w-4 h-4" /> :
                      activity.type === 'trend' ? <TrendingUp className="w-4 h-4" /> :
                        <Video className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.location}</p>
                    <p className="text-xs text-muted-foreground">{activity.event}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  onClick={() => onNavigate(action.action)}
                >
                  <action.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Server', value: 'Online' },
                { label: 'Cameras', value: '42 Active' },
                { label: 'Last Sync', value: 'Just now' }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-crowd-low" />
                    <span className="font-medium">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Distribution */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="font-semibold mb-6">Crowd Distribution</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { label: 'Low', count: lowCount, color: 'bg-crowd-low' },
            { label: 'Moderate', count: mediumCount, color: 'bg-crowd-medium' },
            { label: 'High', count: highCount, color: 'bg-crowd-high' }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-4xl font-semibold mb-2 tabular-nums">{item.count}</div>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <div className="w-full h-1 bg-secondary rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / totalLocations) * 100}%` }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
