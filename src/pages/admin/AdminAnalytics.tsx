import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Users, MapPin, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetropolisLocations } from '@/data/mockLocations';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('7days');

  const stats = useMemo(() => {
    const totalCurrentVisitors = MetropolisLocations.reduce((sum, loc) => sum + loc.currentCount, 0);
    const avgCapacity = MetropolisLocations.reduce((acc, loc) => acc + (loc.currentCount / loc.capacity), 0) / MetropolisLocations.length;

    const topLocations = [...MetropolisLocations]
      .sort((a, b) => b.currentCount - a.currentCount)
      .slice(0, 5)
      .map(loc => ({ name: loc.name, value: loc.currentCount, capacity: loc.capacity }));

    const levels = { low: 0, medium: 0, high: 0 };
    MetropolisLocations.forEach(loc => levels[loc.crowdLevel]++);

    const distributionData = [
      { name: 'High', value: levels.high, color: 'hsl(var(--crowd-high))' },
      { name: 'Moderate', value: levels.medium, color: 'hsl(var(--crowd-medium))' },
      { name: 'Low', value: levels.low, color: 'hsl(var(--crowd-low))' },
    ];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const base = 85000;
      const isWeekend = i >= 5;
      return {
        day: days[i],
        visitors: Math.floor(base * (isWeekend ? 1.4 : 1.0) + (Math.random() - 0.5) * 15000),
        lastWeek: Math.floor(base * 0.9 + (Math.random() - 0.5) * 10000),
      };
    });

    return { totalCurrentVisitors, avgCapacity: Math.round(avgCapacity * 100), topLocations, distributionData, trendData, busiest: topLocations[0] };
  }, [dateRange]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Crowd trends and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors', value: stats.totalCurrentVisitors.toLocaleString(), icon: Users },
          { label: 'Busiest Location', value: stats.busiest.name, icon: MapPin },
          { label: 'Avg Capacity', value: `${stats.avgCapacity}%`, icon: TrendingUp },
          { label: 'Locations', value: MetropolisLocations.length, icon: MapPin }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-semibold truncate">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Weekly Trend</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              This Week
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-border" />
              Last Week
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trendData}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="font-medium text-sm mb-1">{label}</p>
                        {payload.map((entry: any, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground">{entry.name}: {entry.value.toLocaleString()}</p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="lastWeek" stroke="hsl(var(--border))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Last Week" />
              <Area type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" fill="url(#colorVisitors)" strokeWidth={2} name="This Week" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Locations */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-semibold mb-4">Top Locations</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topLocations} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={100} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="font-medium text-sm">{payload[0].payload.name}</p>
                          <p className="text-xs text-muted-foreground">{payload[0].value?.toLocaleString()} visitors</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-semibold mb-4">Status Distribution</h2>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {stats.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-sm text-muted-foreground ml-1">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 40 }}>
              <div className="text-center">
                <span className="text-3xl font-semibold">{MetropolisLocations.length}</span>
                <span className="block text-xs text-muted-foreground">Locations</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
