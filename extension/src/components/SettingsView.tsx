import { useEffect, useState } from 'react';
import type { Settings } from '../../types';
import { getSettings, saveSettings } from '../services/storage';

const DEFAULT_N8N = 'https://punithnaidu2006.app.n8n.cloud/webhook-test/dsa-coach/event';

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>({
    n8nUrl: DEFAULT_N8N,
    profile_id: 'default',
    daily_goal_minutes: 60,
    notifications_enabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden">
        {/* n8n URL */}
        <div className="p-4 border-b border-slate-700/50">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
            n8n Webhook URL
          </label>
          <input
            id="n8n-url-input"
            type="url"
            value={settings.n8nUrl}
            onChange={e => setSettings(s => ({ ...s, n8nUrl: e.target.value }))}
            placeholder={DEFAULT_N8N}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors font-mono"
          />
          <p className="text-[10px] text-slate-600 mt-1">
            All events are sent to this webhook endpoint
          </p>
        </div>

        {/* Profile ID */}
        <div className="p-4 border-b border-slate-700/50">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
            Profile ID
          </label>
          <input
            id="profile-id-input"
            type="text"
            value={settings.profile_id}
            onChange={e => setSettings(s => ({ ...s, profile_id: e.target.value }))}
            placeholder="default"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Daily Goal */}
        <div className="p-4 border-b border-slate-700/50">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
            Daily Goal (minutes)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="goal-minutes-input"
              type="range"
              min={15}
              max={180}
              step={15}
              value={settings.daily_goal_minutes}
              onChange={e => setSettings(s => ({ ...s, daily_goal_minutes: Number(e.target.value) }))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-indigo-400 font-bold text-sm w-12 text-right">
              {settings.daily_goal_minutes}m
            </span>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300 font-medium">Notifications</p>
            <p className="text-[10px] text-slate-500">Reminders and session alerts</p>
          </div>
          <button
            id="notifications-toggle"
            onClick={() => setSettings(s => ({ ...s, notifications_enabled: !s.notifications_enabled }))}
            className={`relative w-10 h-6 rounded-full transition-all ${
              settings.notifications_enabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
              settings.notifications_enabled ? 'left-5' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        id="save-settings-btn"
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
          saved
            ? 'bg-emerald-600 text-white shadow-emerald-900/30'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30 active:scale-95'
        }`}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* Reset */}
      <button
        onClick={() => setSettings({
          n8nUrl: DEFAULT_N8N,
          profile_id: 'default',
          daily_goal_minutes: 60,
          notifications_enabled: true,
        })}
        className="text-xs text-slate-600 hover:text-slate-400 text-center transition-colors"
      >
        Reset to defaults
      </button>

      <p className="text-center text-[10px] text-slate-700 pb-1">
        DSA Coach Extension v1.0 · Secrets stay server-side
      </p>
    </div>
  );
}
