import { motion } from 'framer-motion';
import { Eye, Settings } from 'lucide-react';
import { useMode } from '@/context/ModeContext';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="mode-toggle">
      <motion.div
        className="mode-toggle-slider"
        initial={false}
        animate={{
          left: mode === 'public' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <button
        className={`mode-toggle-option ${mode === 'public' ? 'active' : ''}`}
        onClick={() => setMode('public')}
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">Public</span>
      </button>
      <button
        className={`mode-toggle-option ${mode === 'admin' ? 'active' : ''}`}
        onClick={() => setMode('admin')}
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Admin</span>
      </button>
    </div>
  );
}
