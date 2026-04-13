import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { MetropolisLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { PopularTimesChart } from '@/components/PopularTimesChart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { LocationTypeIcon, locationTypeFilters } from '@/components/LocationTypeIcon';

type FilterType = 'all' | 'mall' | 'foodcourt' | 'park' | 'transit' | 'market' | 'museum' | 'toll';

export default function BestTimes() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const filteredLocations = useMemo(() => {
    return filter === 'all'
      ? MetropolisLocations
      : MetropolisLocations.filter(loc => loc.type === filter);
  }, [filter]);

  const toggleLocationSelection = (id: string) => {
    setSelectedLocations(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  const comparisonLocations = MetropolisLocations.filter(loc => selectedLocations.includes(loc.id));

  return (
    <motion.div
      className="min-h-screen bg-background pt-14 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">Best Times</h1>
          <p className="text-muted-foreground">Find the best times to visit popular spots</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {locationTypeFilters.map((option) => (
                <button
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                    }`}
                  onClick={() => setFilter(option.value as FilterType)}
                >
                  <LocationTypeIcon type={option.value} size={14} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Comparison */}
        {selectedLocations.length > 0 && (
          <motion.div
            className="glass-card p-5 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Compare</h3>
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedLocations([])}
              >
                Clear
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {comparisonLocations.map((location) => (
                <div key={location.id} className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LocationTypeIcon type={location.type} size={16} className="text-muted-foreground" />
                    <span className="font-medium text-sm truncate">{location.name}</span>
                  </div>
                  <PopularTimesChart data={location.popularTimes} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location, index) => (
            <motion.div
              key={location.id}
              className={`glass-card-hover p-4 cursor-pointer ${selectedLocations.includes(location.id) ? 'ring-2 ring-primary' : ''
                }`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => navigate(`/location/${location.id}`)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <LocationTypeIcon type={location.type} size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{location.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                  </div>
                </div>
                <CrowdBadge level={location.crowdLevel} size="sm" showPulse={false} />
              </div>

              <div className="h-14 mb-3">
                <PopularTimesChart data={location.popularTimes} compact />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-crowd-low" />
                  <span className="text-muted-foreground">Best:</span>
                  <span className="font-medium text-crowd-low">{location.bestTime}</span>
                </div>
                <button
                  className="p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLocationSelection(location.id);
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedLocations.includes(location.id)
                    ? 'bg-primary border-primary'
                    : 'border-border'
                    }`}>
                    {selectedLocations.includes(location.id) && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Select up to 3 locations to compare
        </p>
      </div>
    </motion.div>
  );
}
