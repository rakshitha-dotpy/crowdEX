import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, MapPin, Video } from 'lucide-react';
import { MetropolisLocations, Location } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationTypeIcon, locationTypeFilters } from '@/components/LocationTypeIcon';

export default function AdminLocations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const filteredLocations = MetropolisLocations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Locations</h1>
          <p className="text-muted-foreground text-sm">Manage monitored locations</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Coordinates</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Cameras</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Capacity</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map((location, index) => (
              <motion.tr
                key={location.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <LocationTypeIcon type={location.type} size={18} className="text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{location.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{location.address}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <code className="text-xs text-muted-foreground">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </code>
                </td>
                <td className="p-4">
                  <CrowdBadge level={location.crowdLevel} size="sm" showPulse={false} />
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{Math.floor(Math.random() * 4) + 1}</span>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <span className="text-sm">{location.capacity.toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(location)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Location name" defaultValue={editingLocation?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Address" defaultValue={editingLocation?.address} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" placeholder="13.0000" defaultValue={editingLocation?.lat} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" placeholder="80.0000" defaultValue={editingLocation?.lng} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={editingLocation?.type || 'mall'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypeFilters.filter(f => f.value !== 'all').map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        <div className="flex items-center gap-2">
                          <LocationTypeIcon type={f.value} size={14} />
                          <span>{f.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" placeholder="5000" defaultValue={editingLocation?.capacity} />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => setIsModalOpen(false)}>
                {editingLocation ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
