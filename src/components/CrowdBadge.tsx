import { motion } from 'framer-motion';
import { CrowdLevel } from '@/data/mockLocations';

interface CrowdBadgeProps {
  level: CrowdLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function CrowdBadge({ level, size = 'md', showPulse = true }: CrowdBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const labels = {
    low: 'Low',
    medium: 'Moderate',
    high: 'Busy',
  };

  return (
    <motion.span
      className={`badge-${level} ${sizeClasses[size]} font-medium`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {showPulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span 
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              level === 'low' ? 'bg-crowd-low' : level === 'medium' ? 'bg-crowd-medium' : 'bg-crowd-high'
            }`}
          />
          <span 
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              level === 'low' ? 'bg-crowd-low' : level === 'medium' ? 'bg-crowd-medium' : 'bg-crowd-high'
            }`}
          />
        </span>
      )}
      {labels[level]}
    </motion.span>
  );
}
