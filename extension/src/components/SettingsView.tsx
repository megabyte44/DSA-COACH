import { useEffect, useState } from 'react';
import { Plug, Check, RotateCcw, UserCog, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { Settings } from '../types';
import { getSettings, saveSettings, DEFAULT_N8N_URL, DEFAULT_SETTINGS } from '../services/storage';
import { testConnection } from '../services/n8n';
import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';
import { Field, Input, Slider, Switch } from './ui/field';
import { Loading } from './ui/state';
import { cn } from '../lib/utils';

interface Props {
  onRedoOnboarding: () => void;
}

/** A non-default endpoint needs its own host grant; the manifest only ships
 * LeetCode, n8n.cloud and localhost. */
async function ensureHostPermission(url: string): Promise<boolean> {
  try {
    const origin = new URL(url).origin + '/*';
    if (await chrome.permissions.contains({ origins: [origin] })) return true;
    return await chrome.permissions.request({ origins: [origin] });
  } catch {
    return false;
  }
}

export function SettingsView({ onRedoOnboarding }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setPermissionDenied(false);
    if (!(await ensureHostPermission(settings.n8nUrl))) return setPermissionDenied(true);
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await ensureHostPermission(settings.n8nUrl);
    setTestResult(await testConnection(settings.n8nUrl));
    setTesting(false);
  };

  if (loading) return <Loading />;

  const isTestUrl = settings.n8nUrl.includes('/webhook-test/');
  const testOk = testResult?.startsWith('Connected');

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      <Card>
        <CardHeader title="Connection" icon={<Plug className="h-3 w-3" />} />
        <CardBody className="flex flex-col gap-3 pt-1">
          <Field
            label="n8n event webhook"
            hint="Ends in /dsa-coach/event — the plan and cold-start endpoints are derived from it."
          >
            <Input
              type="url"
              value={settings.n8nUrl}
              onChange={e => setSettings(s => ({ ...s, n8nUrl: e.target.value }))}
              placeholder={DEFAULT_N8N_URL}
              className="font-mono text-[11px]"
            />
          </Field>

          {isTestUrl && (
            <div className="flex gap-2 rounded-lg border border-warning/25 bg-warning/10 p-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <p className="text-[10px] leading-relaxed text-warning/90">
                This is a test URL. n8n answers it once, right after you click “Execute workflow”.
                Use the <span className="font-mono">/webhook/</span> path for normal use.
              </p>
            </div>
          )}

          <Button variant="secondary" size="sm" block disabled={testing} onClick={handleTest}>
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
            {testing ? 'Testing…' : 'Test connection'}
          </Button>

          {testResult && (
            <div className={cn(
              'flex gap-2 rounded-lg border p-2.5',
              testOk ? 'border-success/25 bg-success/10' : 'border-warning/25 bg-warning/10',
            )}>
              {testOk
                ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />}
              <p className={cn('text-[10px] leading-relaxed', testOk ? 'text-success/90' : 'text-warning/90')}>
                {testResult}
              </p>
            </div>
          )}

          {permissionDenied && (
            <p className="text-[10px] text-danger">
              Chrome didn't grant permission for that host — settings not saved.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Profile" icon={<UserCog className="h-3 w-3" />} />
        <CardBody className="flex flex-col gap-3 pt-1">
          <Field label="Profile ID" hint="Set automatically when you complete onboarding.">
            <Input
              value={settings.profile_id}
              onChange={e => setSettings(s => ({ ...s, profile_id: e.target.value }))}
              className="font-mono text-[11px]"
            />
          </Field>

          <Field label={`Daily goal · ${settings.daily_goal_minutes} min`}>
            <Slider
              value={settings.daily_goal_minutes}
              onValueChange={v => setSettings(s => ({ ...s, daily_goal_minutes: v }))}
              min={15}
              max={180}
              step={15}
            />
          </Field>

          <div className="flex items-center justify-between border-t border-border-subtle pt-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">Notifications</p>
              <p className="text-[10px] text-faint">Saved, but not wired up yet</p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={v => setSettings(s => ({ ...s, notifications_enabled: v }))}
            />
          </div>
        </CardBody>
      </Card>

      <Button block variant={saved ? 'secondary' : 'primary'} onClick={handleSave}>
        {saved ? <Check className="h-3.5 w-3.5 text-success" /> : null}
        {saved ? 'Saved' : 'Save settings'}
      </Button>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => setSettings(s => ({ ...DEFAULT_SETTINGS, onboarded: s.onboarded }))}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={onRedoOnboarding}>
          <UserCog className="h-3 w-3" />
          Redo onboarding
        </Button>
      </div>

      <p className="pb-1 text-center text-[10px] text-faint">
        DSA Coach v1.0 · secrets stay server-side
      </p>
    </div>
  );
}
