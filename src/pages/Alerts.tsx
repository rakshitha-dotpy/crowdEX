import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MetropolisLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';

interface Alert {
    id: string;
    locationId: string;
    locationName: string;
    condition: 'low' | 'medium';
    isActive: boolean;
}

const initialAlerts: Alert[] = [
    {
        id: '1',
        locationId: '1',
        locationName: 'Express Avenue Mall',
        condition: 'low',
        isActive: true
    },
    {
        id: '2',
        locationId: '4',
        locationName: 'Marina Beach',
        condition: 'medium',
        isActive: false
    }
];

export default function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newAlertLocation, setNewAlertLocation] = useState<string>('');
    const [newAlertCondition, setNewAlertCondition] = useState<'low' | 'medium'>('low');

    const getLocationStatus = (id: string) => {
        return MetropolisLocations.find(l => l.id === id)?.crowdLevel || 'low';
    };

    const handleAddAlert = () => {
        if (!newAlertLocation) return;

        const location = MetropolisLocations.find(l => l.id === newAlertLocation);
        if (!location) return;

        const newAlert: Alert = {
            id: Math.random().toString(36).substr(2, 9),
            locationId: location.id,
            locationName: location.name,
            condition: newAlertCondition,
            isActive: true
        };

        setAlerts([...alerts, newAlert]);
        setIsDialogOpen(false);
        setNewAlertLocation('');
    };

    const removeAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    return (
        <motion.div
            className="min-h-screen bg-background pt-20 pb-20 lg:pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Alerts</h1>
                        <p className="text-muted-foreground">Get notified when crowd levels drop</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Alert</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Alert</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Location</Label>
                                    <Select value={newAlertLocation} onValueChange={setNewAlertLocation}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a place..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MetropolisLocations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notify me when crowd drops to</Label>
                                    <Select value={newAlertCondition} onValueChange={(v: any) => setNewAlertCondition(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">🟢 Low (Best Time)</SelectItem>
                                            <SelectItem value="medium">🟡 Medium (Acceptable)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full mt-2" onClick={handleAddAlert} disabled={!newAlertLocation}>
                                    Set Alert
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {alerts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-muted-foreground"
                            >
                                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No alerts set yet</p>
                            </motion.div>
                        ) : (
                            alerts.map((alert) => {
                                const currentStatus = getLocationStatus(alert.locationId);
                                const isMet = (alert.condition === 'low' && currentStatus === 'low') ||
                                    (alert.condition === 'medium' && ['low', 'medium'].includes(currentStatus));

                                return (
                                    <motion.div
                                        key={alert.id}
                                        className="glass-card p-4 sm:p-6"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    <h3 className="font-semibold">{alert.locationName}</h3>
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-4">
                                                    Alert when: <span className="font-medium text-foreground">Crowd drops to {alert.condition.toUpperCase()}</span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-xs text-muted-foreground">Current Status:</div>
                                                    <CrowdBadge level={currentStatus} size="sm" />
                                                    {isMet && (
                                                        <span className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1">
                                                            <Bell className="w-3 h-3" />
                                                            Condition Met!
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive transition-colors -mt-2 -mr-2"
                                                onClick={() => removeAlert(alert.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
