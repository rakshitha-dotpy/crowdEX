export interface BusRoute {
    id: string;
    from: string;
    to: string;
    occupation: number;
    status: string;
    nextBus: number;
    trend: 'rising' | 'falling' | 'stable';
}

export interface TrainRoute {
    id: string;
    route: string;
    occupation: number;
    status: string;
    nextTrain: number;
    trend: 'rising' | 'falling' | 'stable';
}

// Seeded pseudo-random number generator (same as mockLocations)
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
    };
}

// Per-hour base patterns (like mockLocations) – bus and train, 24 hours
const busHourPattern: Record<number, number> = {
    0: 0.08, 1: 0.05, 2: 0.04, 3: 0.06, 4: 0.12, 5: 0.25, 6: 0.55, 7: 0.85, 8: 0.9, 9: 0.75,
    10: 0.5, 11: 0.45, 12: 0.5, 13: 0.45, 14: 0.5, 15: 0.55, 16: 0.7, 17: 0.9, 18: 0.9, 19: 0.8,
    20: 0.6, 21: 0.4, 22: 0.25, 23: 0.12,
};
const trainHourPattern: Record<number, number> = {
    0: 0.05, 1: 0.03, 2: 0.02, 3: 0.04, 4: 0.15, 5: 0.4, 6: 0.75, 7: 0.9, 8: 0.95, 9: 0.8,
    10: 0.55, 11: 0.5, 12: 0.5, 13: 0.5, 14: 0.55, 15: 0.65, 16: 0.8, 17: 0.95, 18: 0.9, 19: 0.75,
    20: 0.5, 21: 0.35, 22: 0.2, 23: 0.1,
};

// Route-type modifiers: some routes are consistently busier or quieter
const busRouteModifier: Record<string, number> = {
    '21G': 1.15, '29C': 1.2, '102': 1.0, '5C': 0.95, '27C': 1.1, '18': 1.05,
    '11C': 1.0, '47A': 0.95, '23C': 1.0, '54': 1.05, '15B': 1.0, '70': 1.1,
};

// Per-route occupation offset so each bus has clearly different occupancy (not all same)
// High-demand routes: positive offset. Quieter routes: negative offset.
const busRouteOccupationOffset: Record<string, number> = {
    '21G': 0.18,   // Broadway–Tambaram: very high demand
    '29C': 0.15,   // Perambur–Besant Nagar: high
    '27C': 0.10,   // CMBT–Thiruvanmiyur
    '70': 0.08,    // Tambaram–T. Nagar
    '18': 0.05,    // Parry–Vadapalani
    '102': 0.02,   // Broadway–Kelambakkam
    '54': 0,       // Koyambedu–OMR
    '11C': -0.03,  // T. Nagar–Adyar
    '23C': -0.05,  // Guindy–Central
    '15B': -0.08,  // Egmore–Velachery
    '5C': -0.10,   // Broadway–Taramani
    '47A': -0.12,  // Anna Nagar–Mylapore: relatively lighter
};
const trainRouteModifier: Record<string, number> = {
    'MRTS': 1.1, 'Metro-B': 1.0, 'Suburban': 1.2, 'Metro-G': 1.05, 'EMU': 1.15,
    'Express': 0.9,
};

// Late-night bump for airport / last-train hours (22–23) so night isn’t always lowest
const trainLateNightBump: Record<string, number> = {
    'Metro-B': 0.25, 'MRTS': 0.1, 'Suburban': 0.05, 'Metro-G': 0.1, 'EMU': 0.05, 'Express': 0.0,
};

function getTransportTimeMultiplier(hour: number, type: 'bus' | 'train', routeId: string): number {
    const pattern = type === 'bus' ? busHourPattern : trainHourPattern;
    let baseLoad = pattern[hour] ?? 0.3;

    const modifier = type === 'bus'
        ? (busRouteModifier[routeId] ?? 1.0)
        : (trainRouteModifier[routeId] ?? 1.0);
    baseLoad *= modifier;

    if (type === 'train' && (hour === 22 || hour === 23)) {
        baseLoad += trainLateNightBump[routeId] ?? 0;
    }

    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
        baseLoad *= 0.85;
    } else if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        baseLoad *= 1.05;
    }

    const seed = routeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + hour * 7919 + dayOfWeek * 1337;
    const rng = seededRandom(seed);
    const variation = (rng() - 0.5) * 0.18;
    return Math.max(0.05, Math.min(0.99, baseLoad + variation));
}

function getTrendFromTime(hour: number, type: 'bus' | 'train'): 'rising' | 'falling' | 'stable' {
    if (hour >= 5 && hour < 8) return 'rising';
    if (hour >= 8 && hour <= 10) return 'stable';
    if (hour > 10 && hour < 16) return 'falling';
    if (hour >= 16 && hour < 18) return 'rising';
    if (hour >= 18 && hour <= 20) return 'stable';
    if (hour > 20) return 'falling';
    return 'stable';
}

const baseBuses: Omit<BusRoute, 'occupation' | 'status' | 'nextBus' | 'trend'>[] = [
    { id: '21G', from: 'Broadway', to: 'Tambaram' },
    { id: '102', from: 'Broadway', to: 'Kelambakkam' },
    { id: '5C', from: 'Broadway', to: 'Taramani' },
    { id: '29C', from: 'Perambur', to: 'Besant Nagar' },
    { id: '27C', from: 'CMBT', to: 'Thiruvanmiyur' },
    { id: '18', from: 'Parry Corner', to: 'Vadapalani' },
    { id: '11C', from: 'T. Nagar', to: 'Adyar' },
    { id: '47A', from: 'Anna Nagar', to: 'Mylapore' },
    { id: '23C', from: 'Guindy', to: 'Central' },
    { id: '54', from: 'Koyambedu', to: 'OMR' },
    { id: '15B', from: 'Egmore', to: 'Velachery' },
    { id: '70', from: 'Tambaram', to: 'T. Nagar' },
];

const baseTrains: Omit<TrainRoute, 'occupation' | 'status' | 'nextTrain' | 'trend'>[] = [
    { id: 'MRTS', route: 'Velachery - Beach' },
    { id: 'Metro-B', route: 'Wimco Nagar - Airport' },
    { id: 'Suburban', route: 'Central - Arakkonam' },
    { id: 'Metro-G', route: 'Central - Poonamallee' },
    { id: 'EMU', route: 'Beach - Tambaram' },
    { id: 'Express', route: 'Egmore - Trichy' },
];

export function getStatus(occupation: number): string {
    if (occupation > 80) return 'Very High';
    if (occupation > 60) return 'Crowded';
    if (occupation > 40) return 'Moderate';
    return 'Low';
}

function getNextArrival(routeId: string, type: 'bus' | 'train'): number {
    const now = new Date();
    // Deterministic but changing per minute
    const seed = routeId.charCodeAt(0) + now.getMinutes() + (type === 'bus' ? 0 : 100);
    const rng = seededRandom(seed);

    // Buses: 2-20 mins, Trains: 3-15 mins
    const min = type === 'bus' ? 2 : 3;
    const max = type === 'bus' ? 20 : 15;

    return Math.floor(rng() * (max - min)) + min;
}

export function getTransportData() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();

    const minuteFluctuation = Math.sin(minute / 10) * 0.05;
    const trend = getTrendFromTime(hour, 'bus');

    const buses: BusRoute[] = baseBuses.map((bus, index) => {
        const timeMultiplier = getTransportTimeMultiplier(hour, 'bus', bus.id);
        const routeOffset = busRouteOccupationOffset[bus.id] ?? 0;
        const seed = bus.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + hour * 31 + minute * 17 + dayOfWeek * 7 + index;
        const rng = seededRandom(seed);
        const noise = (rng() - 0.5) * 0.14;
        let rawOccupation = timeMultiplier + routeOffset + minuteFluctuation + noise;
        rawOccupation = Math.max(0.08, Math.min(0.99, rawOccupation));
        const occupation = Math.round(rawOccupation * 100);
        return {
            ...bus,
            occupation,
            status: getStatus(occupation),
            nextBus: getNextArrival(bus.id, 'bus'),
            trend,
        };
    });

    const trainTrend = getTrendFromTime(hour, 'train');
    const trains: TrainRoute[] = baseTrains.map((train, index) => {
        const timeMultiplier = getTransportTimeMultiplier(hour, 'train', train.id);
        const seed = train.id.charCodeAt(0) + hour * 31 + minute * 17 + dayOfWeek * 7 + index + 1000;
        const rng = seededRandom(seed);
        const noise = (rng() - 0.5) * 0.08;
        let rawOccupation = timeMultiplier + minuteFluctuation + noise;
        rawOccupation = Math.max(0.1, Math.min(0.99, rawOccupation));
        const occupation = Math.round(rawOccupation * 100);
        return {
            ...train,
            occupation,
            status: getStatus(occupation),
            nextTrain: getNextArrival(train.id, 'train'),
            trend: trainTrend,
        };
    });

    return { buses, trains };
}
