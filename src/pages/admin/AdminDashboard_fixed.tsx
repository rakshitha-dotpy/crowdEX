import { motion } from 'framer-motion';
import { MapPin, Video, Users, Bell, TrendingUp, TrendingDown, Clock, Plus, Upload, Eye, FileText } from 'lucide-react';
import CountUp from 'react-countup';
import { MetropolisLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn as cnUtil } from '@/lib/utils';

// Mock activity data
const recentActivity = [
    { id: 1, location: 'Marina Beach', event: 'reached HIGH capacity', time: '2 min ago', type: 'alert' },
    { id: 2, location: 'Express Avenue', event: 'trend changed to RISING', time: '5 min ago', type: 'trend' },
    { id: 3, location: 'T. Nagar', event: 'capacity updated to 3500', time: '12 min ago', type: 'update' },
    { id: 4, location: 'Metropolis Central', event: 'new camera added', time: '25 min ago', type: 'camera' },
    { id: 5, location: 'Phoenix Mall', event: 'dropped to MEDIUM level', time: '32 min ago', type: 'alert' },
];

export default function AdminDashboard() {
    const totalLocations = MetropolisLocations.length;
    const activeCameras = 42;
    const avgCrowdLevel = 65;
    const alertsToday = 12;

    const highCount = MetropolisLocations.filter(l => l.crowdLevel === 'high').length;
    const mediumCount = MetropolisLocations.filter(l => l.crowdLevel === 'medium').length;
    const lowCount = MetropolisLocations.filter(l => l.crowdLevel === 'low').length;

    const stats = [
        { label: 'Total Locations', value: totalLocations, icon: MapPin, color: 'text-primary' },
        { label: 'Active Cameras', value: activeCameras, icon: Video, color: 'text-crowd-low' },
        { label: 'Avg Crowd Level', value: avgCrowdLevel, suffix: '%', icon: Users, color: 'text-crowd-medium' },
        { label: 'Alerts Today', value: alertsToday, icon: Bell, color: 'text-crowd-high' },
    ];

    const quickActions = [
        { label: 'Add Location', icon: Plus, action: () => { } },
        { label: 'Upload Video', icon: Upload, action: () => { } },
        { label: 'View Cameras', icon: Video, action: () => { } },
        { label: 'Generate Report', icon: FileText, action: () => { } },
    ];

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/50">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        System Overview
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">Central Command</h1>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border">
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest h-8 rounded-lg">Real-time</Button>
                    <Button variant="secondary" size="sm" className="text-[10px] font-black uppercase tracking-widest h-8 rounded-lg shadow-sm">Historical</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        className="glass-card p-6 border-zinc-200 shadow-lg relative overflow-hidden group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black tracking-tighter tabular-nums text-zinc-950">
                                        <CountUp end={stat.value} duration={1.5} />
                                    </span>
                                    <span className="text-xs font-black text-zinc-400 uppercase">{stat.suffix}</span>
                                </div>
                            </div>
                            <div className={cnUtil("p-3 rounded-2xl bg-zinc-100 border border-zinc-200 group-hover:bg-zinc-950 group-hover:text-white transition-colors duration-300", stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-tight">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12.5% from baseline</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Live Activity Feed */}
                <motion.div
                    className="lg:col-span-2 glass-card p-6 border-zinc-200 shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            Operational Log
                        </h2>
                        <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Telemetry</span>
                        </div>
                    </div>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-4 pr-4">
                            {recentActivity.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    className="group flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-transparent hover:border-zinc-200 hover:bg-white hover:shadow-md transition-all duration-300"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <div className={cnUtil(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12",
                                        activity.type === 'alert' ? 'bg-red-50 text-red-500' :
                                            activity.type === 'trend' ? 'bg-orange-50 text-orange-500' :
                                                'bg-zinc-100 text-zinc-500'
                                    )}>
                                        {activity.type === 'alert' ? <Bell className="w-5 h-5" /> :
                                            activity.type === 'trend' ? <TrendingUp className="w-5 h-5" /> :
                                                <Eye className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">{activity.location}</p>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">{activity.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight">
                                            {activity.event}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollArea>
                </motion.div>

                {/* Tactical Shortcuts & Health */}
                <div className="space-y-6">
                    <motion.div
                        className="glass-card p-6 border-zinc-950 bg-zinc-950 text-white shadow-2xl overflow-hidden relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">Tactical Shortcuts</h2>
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            {quickActions.map((action, index) => (
                                <button
                                    key={action.label}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-white hover:text-zinc-950 transition-all duration-300 group"
                                    onClick={action.action}
                                >
                                    <action.icon className="w-5 h-5 opacity-60 group-hover:opacity-100" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* System Health */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Core Infrastructure</h3>
                            <div className="space-y-5">
                                {[
                                    { label: 'Server Status', value: 'Online', color: 'bg-green-500' },
                                    { label: 'Active Cameras', value: '42 Active', color: 'bg-green-500' },
                                    { label: 'Sync Status', value: 'Synchronized', color: 'bg-green-500' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={cnUtil("w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]", item.color)} />
                                            <span className="text-[11px] font-black uppercase tracking-tight">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Density Distribution */}
            <motion.div
                className="glass-card p-8 border-zinc-200 shadow-xl relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        Capacity Distribution
                    </h2>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aggregate Data</div>
                </div>

                <div className="grid sm:grid-cols-3 gap-8">
                    {[
                        { label: 'Critical Density', count: highCount, color: 'text-red-500', bg: 'bg-red-50', level: 'High' },
                        { label: 'Moderate Load', count: mediumCount, color: 'text-orange-500', bg: 'bg-orange-50', level: 'Med' },
                        { label: 'Optimal Flow', count: lowCount, color: 'text-green-500', bg: 'bg-green-50', level: 'Low' }
                    ].map((item, i) => (
                        <div key={i} className="relative group">
                            <div className={cnUtil("absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500", item.bg)}></div>
                            <div className="relative p-4 rounded-2xl border border-transparent transition-all">
                                <div className="flex items-end justify-between mb-4">
                                    <p className="text-5xl font-black tracking-tighter tabular-nums text-zinc-950">{item.count}</p>
                                    <p className={cnUtil("text-xs font-black uppercase tracking-widest", item.color)}>{item.level}</p>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / totalLocations) * 100}%` }}
                                        className={cnUtil("h-full", item.color.replace('text', 'bg'))}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">{item.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
