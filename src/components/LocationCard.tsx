import { motion } from 'framer-motion';
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Location } from '@/data/mockLocations';
import { CrowdBadge } from './CrowdBadge';
import { LocationTypeIcon } from './LocationTypeIcon';

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
  index?: number;
}

export function LocationCard({ location, onClick, index = 0 }: LocationCardProps) {
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

  return (
    <motion.div
      className="glass-card-hover cursor-pointer p-3"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <LocationTypeIcon type={location.type} size={18} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground truncate">{location.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{location.address}</p>

            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span className="text-xs capitalize">{location.trend}</span>
              </div>
            </div>
          </div>
        </div>
        <CrowdBadge level={location.crowdLevel} size="sm" showPulse={false} />
      </div>
    </motion.div>
  );
}
