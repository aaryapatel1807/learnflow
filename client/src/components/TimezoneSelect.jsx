import { useState } from 'react';
import api from '../api/axios';
import { getUser, setUser } from '../utils/auth';

const FALLBACK_ZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];

const listTimeZones = () => {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const zones = Intl.supportedValuesOf('timeZone');
      if (zones && zones.length) return zones;
    }
  } catch (e) {
    /* older browser — fall through to the short list */
  }
  return FALLBACK_ZONES;
};

const detectTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
};

/**
 * Small timezone picker. PATCHes /api/users/me/timezone and keeps the local
 * user cache in sync so streaks/heatmap day boundaries follow the user.
 */
function TimezoneSelect() {
  const zones = listTimeZones();
  const cached = getUser();
  const initial = cached?.timezone || detectTimeZone();
  // Ensure the current value is always selectable, even if the list lacks it.
  const options = zones.includes(initial) ? zones : [initial, ...zones];
  const [tz, setTz] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  const handleChange = async (e) => {
    const next = e.target.value;
    setTz(next);
    setSavedTick(false);
    setSaving(true);
    try {
      await api.patch('/users/me/timezone', { timezone: next });
      const u = getUser();
      if (u) setUser({ ...u, timezone: next });
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2500);
    } catch (err) {
      console.error('Error saving timezone:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="tz-select" title="Timezone used for streaks and daily stats">
      <span className="tz-select-label" aria-hidden="true">🌍</span>
      <select value={tz} onChange={handleChange} disabled={saving} aria-label="Timezone">
        {options.map((z) => (
          <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <span className="tz-select-hint" role="status">
        {saving ? 'Saving…' : savedTick ? '✓ Saved' : ''}
      </span>
    </label>
  );
}

export default TimezoneSelect;
