import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    thresholdLow: 40,
    thresholdMedium: 70,
    alertHighCapacity: true,
    alertCameraOffline: true,
    emailSummary: false,
    mapApiKey: '',
    aiApiKey: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('NovaWatch_settings');
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) { }
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('NovaWatch_settings', JSON.stringify(settings));
      setLoading(false);
      toast({ title: 'Settings saved', description: 'Your configuration has been updated.' });
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      const defaults = { thresholdLow: 40, thresholdMedium: 70, alertHighCapacity: true, alertCameraOffline: true, emailSummary: false, mapApiKey: '', aiApiKey: '' };
      setSettings(defaults);
      localStorage.removeItem('NovaWatch_settings');
      toast({ title: 'Settings reset', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure system preferences</p>
        </div>
        <Button onClick={handleSave} disabled={loading} size="icon" title="Save Settings">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>

      {/* Thresholds */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-semibold mb-6">Crowd Thresholds</h2>
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-crowd-low">Low Threshold</Label>
                <p className="text-xs text-muted-foreground">0% - {settings.thresholdLow}%</p>
              </div>
              <span className="font-semibold">{settings.thresholdLow}%</span>
            </div>
            <Slider value={[settings.thresholdLow]} onValueChange={([v]) => setSettings(s => ({ ...s, thresholdLow: v }))} max={100} step={5} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-crowd-medium">Medium Threshold</Label>
                <p className="text-xs text-muted-foreground">{settings.thresholdLow}% - {settings.thresholdMedium}%</p>
              </div>
              <span className="font-semibold">{settings.thresholdMedium}%</span>
            </div>
            <Slider value={[settings.thresholdMedium]} onValueChange={([v]) => setSettings(s => ({ ...s, thresholdMedium: v }))} max={100} step={5} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-crowd-high">High Threshold</Label>
                <p className="text-xs text-muted-foreground">{settings.thresholdMedium}% - 100%</p>
              </div>
              <span className="font-semibold">100%</span>
            </div>
            <Slider value={[100]} disabled max={100} className="opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* API Keys */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="font-semibold mb-6">API Keys</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Map API Key</Label>
            <Input type="password" value={settings.mapApiKey} onChange={(e) => setSettings(s => ({ ...s, mapApiKey: e.target.value }))} placeholder="pk_..." />
          </div>
          <div className="space-y-2">
            <Label>AI API Key</Label>
            <Input type="password" value={settings.aiApiKey} onChange={(e) => setSettings(s => ({ ...s, aiApiKey: e.target.value }))} placeholder="sk_..." />
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="font-semibold mb-6">Notifications</h2>
        <div className="space-y-4">
          {[
            { key: 'alertHighCapacity', label: 'High capacity alerts', desc: 'Notify when locations reach capacity' },
            { key: 'alertCameraOffline', label: 'Camera offline alerts', desc: 'Notify when cameras disconnect' },
            { key: 'emailSummary', label: 'Daily summary', desc: 'Receive daily email reports' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <Label>{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={(settings as any)[item.key]} onCheckedChange={(c) => setSettings(s => ({ ...s, [item.key]: c }))} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-semibold mb-4">Data Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { localStorage.removeItem('NovaWatch_cache'); toast({ title: 'Cache cleared' }); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
          <Button variant="destructive" onClick={handleReset}>
            <Trash2 className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
