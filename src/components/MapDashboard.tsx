import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, List } from 'lucide-react';
import { CrowdMap } from './CrowdMap';
import { LocationCard } from './LocationCard';
import { MetropolisLocations, Location } from '@/data/mockLocations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { LocationTypeIcon, locationTypeFilters } from './LocationTypeIcon';

type FilterType = 'all' | 'mall' | 'foodcourt' | 'park' | 'transit' | 'market' | 'museum' | 'toll';
type SortType = 'crowd' | 'distance' | 'name';

export function MapDashboard() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy] = useState<SortType>('crowd');
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showListMobile, setShowListMobile] = useState(false);

  const filteredLocations = useMemo(() => {
    let filtered = filter === 'all'
      ? MetropolisLocations
      : MetropolisLocations.filter(loc => loc.type === filter);

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'crowd') {
        const crowdOrder = { high: 0, medium: 1, low: 2 };
        return crowdOrder[a.crowdLevel] - crowdOrder[b.crowdLevel];
      }
      if (sortBy === 'distance') {
        const distA = parseFloat(a.distance?.replace(' km', '') || '0');
        const distB = parseFloat(b.distance?.replace(' km', '') || '0');
        return distA - distB;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [filter, sortBy]);

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleViewDetails = (location: Location) => {
    navigate(`/location/${location.id}`);
  };

  const crowdStats = useMemo(() => {
    const low = MetropolisLocations.filter(l => l.crowdLevel === 'low').length;
    const medium = MetropolisLocations.filter(l => l.crowdLevel === 'medium').length;
    const high = MetropolisLocations.filter(l => l.crowdLevel === 'high').length;
    return { low, medium, high };
  }, []);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row relative">
      {/* Map */}
      <div className="flex-1 relative">
        <CrowdMap
          locations={filteredLocations}
          onLocationSelect={handleLocationClick}
          onNavigate={handleViewDetails}
          selectedLocation={selectedLocation}
        />



        {/* Mobile List Toggle */}
        <button
          className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-5 py-2.5 flex items-center gap-2 z-10 shadow-lg"
          onClick={() => setShowListMobile(!showListMobile)}
        >
          <List className="w-4 h-4" />
          <span className="text-sm font-medium">View List</span>
          <ChevronUp className={`w-4 h-4 transition-transform ${showListMobile ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Side Panel - Desktop */}
      <motion.div
        className={`hidden lg:flex flex-col border-l border-border bg-background ${panelExpanded ? 'w-96' : 'w-0'}`}
        initial={false}
        animate={{ width: panelExpanded ? 384 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {panelExpanded && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Locations</h2>
                <span className="text-sm text-muted-foreground">{filteredLocations.length} places</span>
              </div>

              {/* Filters */}
              <ScrollArea className="w-full" orientation="horizontal">
                <div className="flex gap-2 pb-2 w-max">
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
            </div>

            {/* Location List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {filteredLocations.map((location, index) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    index={index}
                    onClick={() => handleLocationClick(location)}
                  />
                ))}
              </div>
            </ScrollArea>
          </>
        )
        }
      </motion.div >

      {/* Toggle Panel Button */}
      <button
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 bg-card border border-border p-2 rounded-l-lg"
        onClick={() => setPanelExpanded(!panelExpanded)}
        style={{ right: panelExpanded ? 384 : 0 }}
      >
        <ChevronUp className={`w-4 h-4 transition-transform ${panelExpanded ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {
          showListMobile && (
            <motion.div
              className="lg:hidden fixed inset-x-0 bottom-16 z-30 bg-background rounded-t-2xl shadow-lg border-t border-border max-h-[70vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-4">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

                {/* Filter */}
                <ScrollArea className="w-full mb-4" orientation="horizontal">
                  <div className="flex gap-2 pb-2 w-max">
                    {locationTypeFilters.map((option) => (
                      <button
                        key={option.value}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                          }`}
                        onClick={() => setFilter(option.value as FilterType)}
                      >
                        <LocationTypeIcon type={option.value} size={14} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                {/* Location List */}
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2 pr-4">
                    {filteredLocations.map((location, index) => (
                      <LocationCard
                        key={location.id}
                        location={location}
                        index={index}
                        onClick={() => handleLocationClick(location)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence>
    </div>
  );
}
