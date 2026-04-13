import { Building2, Utensils, TreePine, Train, ShoppingCart, Landmark, MapPin, Milestone } from 'lucide-react';

export type LocationType = 'mall' | 'foodcourt' | 'park' | 'transit' | 'market' | 'museum' | 'toll' | 'all';

interface LocationTypeIconProps {
    type: LocationType;
    className?: string;
    size?: number;
}

/**
 * Clean black and white line icons for location types
 * Uses Lucide icons for consistent illustration style
 */
export function LocationTypeIcon({ type, className = '', size = 18 }: LocationTypeIconProps) {
    const iconProps = {
        className: `${className}`,
        size,
        strokeWidth: 1.5
    };

    switch (type) {
        case 'mall':
            return <Building2 {...iconProps} />;
        case 'foodcourt':
            return <Utensils {...iconProps} />;
        case 'park':
            return <TreePine {...iconProps} />;
        case 'transit':
            return <Train {...iconProps} />;
        case 'market':
            return <ShoppingCart {...iconProps} />;
        case 'museum':
            return <Landmark {...iconProps} />;
        case 'toll':
            return <Milestone {...iconProps} />;
        case 'all':
        default:
            return <MapPin {...iconProps} />;
    }
}

// For use in filter buttons - includes label
export const locationTypeFilters: { value: LocationType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'mall', label: 'Malls' },
    { value: 'foodcourt', label: 'Food Courts' },
    { value: 'park', label: 'Parks' },
    { value: 'transit', label: 'Transit' },
    { value: 'market', label: 'Markets' },
    { value: 'museum', label: 'Museums' },
    { value: 'toll', label: 'Toll Plazas' },
];
