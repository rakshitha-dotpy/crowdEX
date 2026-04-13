import { motion } from 'framer-motion';
import { MapDashboard } from '@/components/MapDashboard';

export default function PublicHome() {
  return (
    <motion.div
      className="pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <MapDashboard />
    </motion.div>
  );
}
