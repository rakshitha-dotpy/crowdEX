import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, Train, Users, Clock, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getTransportData, BusRoute, TrainRoute } from '../data/mockTransport';

const TransportPage = () => {
    const [buses, setBuses] = useState<BusRoute[]>([]);
    const [trains, setTrains] = useState<TrainRoute[]>([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isUpdating, setIsUpdating] = useState(false);

    const updateData = () => {
        setIsUpdating(true);
        const { buses: newBuses, trains: newTrains } = getTransportData();
        const sortedBuses = [...newBuses].sort((a, b) => b.occupation - a.occupation);
        const sortedTrains = [...newTrains].sort((a, b) => b.occupation - a.occupation);
        setBuses(sortedBuses);
        setTrains(sortedTrains);
        setLastUpdate(new Date());
        setTimeout(() => setIsUpdating(false), 500);
    };

    useEffect(() => {
        // Initial load
        updateData();

        // Update every 5 seconds
        const interval = setInterval(updateData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getTrendIcon = (trend: 'rising' | 'falling' | 'stable') => {
        if (trend === 'rising') return <TrendingUp size={12} className="text-red-500" />;
        if (trend === 'falling') return <TrendingDown size={12} className="text-green-500" />;
        return <Minus size={12} className="text-gray-400" />;
    };

    const hour = new Date().getHours();
    const isPeak = (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 20);
    const crowdHint = isPeak
        ? 'Rush hour — expect higher crowds'
        : hour >= 22 || hour < 5
            ? 'Night — lighter crowds on most routes'
            : 'Off-peak — moderate crowds';

    return (
        <motion.div
            className="min-h-screen bg-background pt-14 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="container mx-auto px-4 max-w-4xl">
                <header className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Public Transport Live</h1>
                            <p className="text-muted-foreground">Real-time occupation levels in Metropolis</p>
                            <p className="text-xs text-muted-foreground mt-1.5">{crowdHint}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin text-primary' : ''}`} />
                            <span>Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </header>

                <div className="grid gap-6">
                    {/* Buses Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                <Bus size={22} />
                            </div>
                            <h2 className="text-lg font-semibold">Bus Routes</h2>
                            <span className="text-xs text-muted-foreground ml-auto">{buses.length} active routes</span>
                        </div>
                        <div className="grid gap-3">
                            {buses.map((route) => (
                                <motion.div
                                    key={route.id}
                                    className="glass-card p-3 flex items-center justify-between"
                                    whileHover={{ scale: 1.005 }}
                                    layout
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                                            {route.id}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{route.from} → {route.to}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} /> {route.occupation}%
                                                    {getTrendIcon(route.trend)}
                                                </span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {route.nextBus}min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${route.occupation > 80 ? 'bg-red-500/10 text-red-500' :
                                        route.occupation > 60 ? 'bg-orange-500/10 text-orange-500' :
                                            route.occupation > 40 ? 'bg-yellow-500/10 text-yellow-600' :
                                                'bg-green-500/10 text-green-600'
                                        }`}>
                                        {route.status}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Trains Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                                <Train size={22} />
                            </div>
                            <h2 className="text-lg font-semibold">Train Lines</h2>
                            <span className="text-xs text-muted-foreground ml-auto">{trains.length} active lines</span>
                        </div>
                        <div className="grid gap-3">
                            {trains.map((route) => (
                                <motion.div
                                    key={route.id}
                                    className="glass-card p-3 flex items-center justify-between"
                                    whileHover={{ scale: 1.005 }}
                                    layout
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                                            <Train size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{route.id}: {route.route}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} /> {route.occupation}%
                                                    {getTrendIcon(route.trend)}
                                                </span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {route.nextTrain}min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${route.occupation > 80 ? 'bg-red-500/10 text-red-500' :
                                        route.occupation > 60 ? 'bg-orange-500/10 text-orange-500' :
                                            route.occupation > 40 ? 'bg-yellow-500/10 text-yellow-600' :
                                                'bg-green-500/10 text-green-600'
                                        }`}>
                                        {route.status}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Alert Banner */}
                    <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-semibold text-yellow-700">Service Update</p>
                            <p className="text-xs text-yellow-600/80 mt-0.5">
                                Expect higher crowds on MRTS lines due to ongoing IPL match at Chepauk. Additional metro services running until midnight.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TransportPage;
