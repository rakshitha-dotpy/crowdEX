import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Clock, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, BarChart3 } from 'lucide-react';
import CountUp from 'react-countup';
import { XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { MetropolisLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { PopularTimesChart } from '@/components/PopularTimesChart';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { LocationTypeIcon } from '@/components/LocationTypeIcon';

const generateTrendData = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const time = new Date(now.getTime() - (11 - i) * 15 * 60000);
    return {
      time: time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      count: Math.floor(Math.random() * 500) + 800,
    };
  });
};

export default function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const location = MetropolisLocations.find(loc => loc.id === id);

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Location not found</p>
      </div>
    );
  }

  const capacityPercentage = Math.round((location.currentCount / location.capacity) * 100);
  const trendData = generateTrendData();

  const TrendIcon = {
    rising: TrendingUp,
    falling: TrendingDown,
    stable: Minus,
  }[location.trend];

  const trendColor = {
    rising: 'text-crowd-high',
    falling: 'text-crowd-low',
    stable: 'text-muted-foreground',
  }[location.trend];

  const stats = [
    { label: 'Peak hours', value: '5 PM - 7 PM', icon: Clock },
    { label: 'Avg wait', value: '~12 min', icon: AlertTriangle },
    { label: 'vs yesterday', value: '+15%', icon: BarChart3 },
    { label: 'Next hour', value: location.trend === 'rising' ? 'Busier' : 'Quieter', icon: TrendingUp },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background pt-14 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Hero */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <LocationTypeIcon type={location.type} size={24} className="text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{location.name}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{location.address}</span>
                </div>
              </div>
            </div>
            <CrowdBadge level={location.crowdLevel} size="md" />
          </div>

          <div className={`grid gap-3 ${role === 'admin' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {role === 'admin' ? (
              <div className="text-center p-3 bg-secondary rounded-xl">
                <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-semibold tabular-nums">
                  <CountUp end={location.currentCount} duration={1} separator="," />
                </div>
                <div className="text-xs text-muted-foreground">people</div>
              </div>
            ) : (
              <div className="text-center p-3 bg-secondary rounded-xl">
                <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-semibold capitalize">{location.crowdLevel}</div>
                <div className="text-xs text-muted-foreground">level</div>
              </div>
            )}
            {role === 'admin' && (
              <div className="text-center p-3 bg-secondary rounded-xl">
                <BarChart3 className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-semibold tabular-nums">{capacityPercentage}%</div>
                <div className="text-xs text-muted-foreground">capacity</div>
              </div>
            )}
            <div className="text-center p-3 bg-secondary rounded-xl">
              <TrendIcon className={`w-4 h-4 mx-auto mb-1 ${trendColor}`} />
              <div className="text-lg font-semibold capitalize">{location.trend}</div>
              <div className="text-xs text-muted-foreground">trend</div>
            </div>
            <div className="text-center p-3 bg-secondary rounded-xl">
              <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-lg font-semibold">~12</div>
              <div className="text-xs text-muted-foreground">min wait</div>
            </div>
          </div>

          {role === 'admin' && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{capacityPercentage}%</span>
              </div>
              <Progress value={capacityPercentage} className="h-2" />
            </div>
          )}
        </motion.div>

        {/* Best Time */}
        <motion.div
          className="glass-card p-5 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-crowd-low/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-crowd-low" />
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground text-sm">Best Time to Visit</h3>
              <p className="text-xl font-semibold">{location.bestTime}</p>
              <p className="text-sm text-muted-foreground mt-0.5">40% less crowded than peak hours</p>
            </div>
          </div>
        </motion.div>

        {/* Popular Times */}
        <motion.div
          className="glass-card p-5 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold mb-4">Popular Times</h3>
          <PopularTimesChart data={location.popularTimes} />
        </motion.div>

        {/* Live Trend */}
        <motion.div
          className="glass-card p-5 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Trend</h3>
            <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{location.trend}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval={2}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-sm font-medium">{payload[0].value}</p>
                        <p className="text-xs text-muted-foreground">{payload[0].payload.time}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="w-3.5 h-3.5" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="font-semibold">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
