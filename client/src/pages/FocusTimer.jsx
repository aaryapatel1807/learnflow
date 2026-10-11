import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './FocusTimer.css';

const PRESETS = [
  { kind: 'focus', label: 'Focus', minutes: 25, hint: 'Deep work block' },
  { kind: 'focus', label: 'Deep dive', minutes: 50, hint: 'Long study session' },
  { kind: 'short-break', label: 'Short break', minutes: 5, hint: 'Stretch & breathe' },
  { kind: 'long-break', label: 'Long break', minutes: 15, hint: 'Recharge fully' },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Persistence layer for the focus timer (survives reload / tab close).
 * Saved on every tick while running; restored on mount.
 */
const TIMER_STORAGE_KEY = 'learnflow:focus-timer';

const readSavedTimer = () => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const clearSavedTimer = () => {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  } catch (e) {
    /* storage unavailable — nothing to clear */
  }
};

const notifyFocusComplete = (kind, minutes) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification('Focus session complete', {
      body: `${minutes} minutes of ${kind === 'focus' ? 'focused study' : 'rest'} complete. Nice work!`
    });
  } catch (e) {
    /* notification blocked — the in-page result card still shows */
  }
};

/**
 * Drift-free ticker. Prefers a Web Worker (keeps ticking when the tab is
 * backgrounded — pattern from tomyrioss/pomodoro-app) and falls back to
 * setInterval. The caller owns the end-time; onTick recomputes from the
 * wall clock so no drift can accumulate either way.
 */
function useTicker(onTick) {
  const workerRef = useRef(null);
  const intervalRef = useRef(null);
  const cbRef = useRef(onTick);
  cbRef.current = onTick;

  const start = () => {
    stop();
    try {
      const w = new Worker('/focus-worker.js');
      w.onmessage = () => cbRef.current();
      w.postMessage({ cmd: 'start', ms: 250 });
      workerRef.current = w;
    } catch (e) {
      intervalRef.current = setInterval(() => cbRef.current(), 250);
    }
  };
  const stop = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ cmd: 'stop' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  useEffect(() => stop, []);
  return { start, stop };
}

function FocusTimer() {
  const user = getUser();
  const navigate = useNavigate();
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customMinutes, setCustomMinutes] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const endAtRef = useRef(null);
  const completeRef = useRef();
  const originalTitleRef = useRef(document.title);

  // Snapshot the current timer state to localStorage (layer on top of the
  // Web Worker ticker — the ticker stays the source of truth for countdown).
  const snapshotTimer = (overrides = {}) => {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        endAt: endAtRef.current,
        totalSeconds,
        presetLabel: preset.label,
        presetKind: preset.kind,
        presetMinutes: preset.minutes,
        customMinutes,
        subjectId,
        sessionId,
        secondsLeft,
        running,
        ...overrides,
      }));
    } catch (e) {
      /* storage unavailable (private mode etc.) — timer still works in-memory */
    }
  };

  const tick = () => {
    const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setSecondsLeft(left);
    snapshotTimer({ secondsLeft: left, running: true });
    if (left <= 0) completeRef.current(true);
  };
  const ticker = useTicker(tick);

  useEffect(() => { fetchStats(); fetchSubjects(); }, []);

  // Restore a persisted timer on mount: resume if the end time is still in
  // the future, restore paused state if one was saved, otherwise clear.
  useEffect(() => {
    const saved = readSavedTimer();
    if (!saved) return;
    const now = Date.now();
    const findPreset = () =>
      PRESETS.find((p) => p.label === saved.presetLabel) || {
        kind: saved.presetKind || 'focus',
        label: saved.presetLabel || 'Custom',
        minutes: saved.presetMinutes || 25,
      };
    if (saved.running && saved.endAt && saved.endAt > now) {
      setPreset(findPreset());
      setCustomMinutes(saved.customMinutes || '');
      setSubjectId(saved.subjectId || '');
      setSessionId(saved.sessionId || null);
      endAtRef.current = saved.endAt;
      setSecondsLeft(Math.max(0, Math.round((saved.endAt - now) / 1000)));
      setRunning(true);
      setLastResult(null);
      ticker.start();
    } else if (!saved.running && saved.secondsLeft > 0) {
      setPreset(findPreset());
      setCustomMinutes(saved.customMinutes || '');
      setSubjectId(saved.subjectId || '');
      setSessionId(saved.sessionId || null);
      setSecondsLeft(saved.secondsLeft);
    } else {
      clearSavedTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab-title countdown while running; restore the original title otherwise.
  useEffect(() => {
    document.title = running ? `⏱ ${formatTime(secondsLeft)} — LearnFlow` : originalTitleRef.current;
  }, [running, secondsLeft]);
  useEffect(() => () => { document.title = originalTitleRef.current; }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/study/stats/${user.id}?days=7&tzOffset=${new Date().getTimezoneOffset()}`);
      const n = new Date();
      const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      const todayStats = res.data.perDay?.[today] || { minutes: 0, sessions: 0 };
      setFocusMinutesToday(todayStats.minutes);
      setCompletedToday(todayStats.sessions);
      setWeekMinutes(res.data.totalMinutes || 0);
    } catch (e) { console.error('Error fetching focus stats:', e); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
    } catch (e) { console.error('Error fetching subjects:', e); }
  };

  const minutesFor = (p) => p.minutes;

  const startTimer = async () => {
    const minutes = customMinutes ? Math.max(1, Math.min(180, parseInt(customMinutes, 10) || 25)) : minutesFor(preset);
    let newSessionId = null;
    try {
      const res = await api.post('/study/sessions', {
        userId: user.id,
        kind: preset.kind,
        plannedMinutes: minutes,
        subjectId: subjectId || undefined,
      });
      newSessionId = res.data._id;
      setSessionId(newSessionId);
    } catch (e) {
      console.error('Error starting session:', e);
    }
    setSecondsLeft(minutes * 60);
    endAtRef.current = Date.now() + minutes * 60 * 1000;
    setRunning(true);
    setLastResult(null);
    snapshotTimer({ running: true, secondsLeft: minutes * 60, sessionId: newSessionId });
    ticker.start();
    // Ask for notification permission on the user gesture (never on load).
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };

  const pauseTimer = () => {
    ticker.stop();
    setRunning(false);
    snapshotTimer({ running: false });
  };

  const resumeTimer = () => {
    endAtRef.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
    snapshotTimer({ running: true });
    ticker.start();
  };

  const completeTimer = async (natural = false) => {
    ticker.stop();
    setRunning(false);
    clearSavedTimer();
    if (!sessionId) { setSecondsLeft(preset.minutes * 60); return; }
    const planned = customMinutes ? Math.max(1, Math.min(180, parseInt(customMinutes, 10) || 25)) : minutesFor(preset);
    const actual = natural ? planned : Math.max(1, Math.round(planned - secondsLeft / 60));
    if (natural) notifyFocusComplete(preset.kind, planned);
    try {
      const res = await api.post(`/study/sessions/${sessionId}/complete`, { userId: user.id, actualMinutes: actual });
      setLastResult({
        kind: preset.kind,
        minutes: actual,
        xp: res.data.xpEarned || 0,
        natural,
      });
      fetchStats();
    } catch (e) { console.error('Error completing session:', e); }
    setSessionId(null);
    setSecondsLeft(planned * 60);
    setCustomMinutes('');
  };
  completeRef.current = completeTimer;

  const abandonTimer = async () => {
    ticker.stop();
    setRunning(false);
    clearSavedTimer();
    if (sessionId) {
      try { await api.post(`/study/sessions/${sessionId}/abandon`, { userId: user.id }); }
      catch (e) { console.error('Error abandoning session:', e); }
    }
    setSessionId(null);
    setSecondsLeft(minutesFor(preset) * 60);
    setCustomMinutes('');
  };

  const totalSeconds = (customMinutes ? Math.max(1, Math.min(180, parseInt(customMinutes, 10) || 25)) : minutesFor(preset)) * 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const ring = 2 * Math.PI * 88;

  return (
    <div className="container focus-page">
      <div className="pp-hero">
        <p className="pp-eyebrow">Focus timer</p>
        <h1 className="pp-title">Study sessions</h1>
        <p className="pp-sub">Pomodoro-style focus blocks. Completed sessions earn XP and keep your streak alive.</p>
      </div>

      <div className="focus-grid">
        {/* Timer card */}
        <section className="pp-panel focus-timer-card">
          <div className="focus-presets" role="tablist" aria-label="Timer presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                role="tab"
                aria-selected={preset.label === p.label && !running}
                className={`btn btn-sm focus-preset ${preset.label === p.label ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { if (!running && !sessionId) { setPreset(p); setSecondsLeft(p.minutes * 60); setCustomMinutes(''); } }}
                disabled={running || !!sessionId}
                title={p.hint}
              >
                {p.label} · {p.minutes}m
              </button>
            ))}
          </div>

          <div className="focus-custom">
            <label htmlFor="focus-custom-min">Custom minutes</label>
            <input
              id="focus-custom-min"
              type="number" min="1" max="180" placeholder="e.g. 40"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              disabled={running || !!sessionId}
            />
          </div>

          <div className="focus-ring-wrap">
            <svg className="focus-ring" viewBox="0 0 200 200" role="img" aria-label={`${formatTime(secondsLeft)} remaining`}>
              <circle cx="100" cy="100" r="88" className="focus-ring-track" />
              <circle
                cx="100" cy="100" r="88" className="focus-ring-fill"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - progress)}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="focus-ring-center">
              <span className="focus-time">{formatTime(secondsLeft)}</span>
              <span className="focus-kind">{preset.kind === 'focus' ? 'Focus' : preset.label}</span>
            </div>
          </div>

          <div className="focus-controls">
            {!running && !sessionId && (
              <button className="btn btn-primary btn-lg" onClick={startTimer}>Start</button>
            )}
            {running && (
              <button className="btn btn-secondary btn-lg" onClick={pauseTimer}>Pause</button>
            )}
            {!running && sessionId && (
              <>
                <button className="btn btn-primary btn-lg" onClick={resumeTimer}>Resume</button>
                <button className="btn btn-secondary" onClick={() => completeTimer(false)}>Finish early</button>
                <button className="btn btn-danger" onClick={abandonTimer}>Give up</button>
              </>
            )}
          </div>

          {lastResult && (
            <div className="pp-panel focus-result" role="status">
              <h3>{lastResult.kind === 'focus' ? '🎯 Session complete!' : '☕ Break over!'}</h3>
              <p>{lastResult.minutes} minutes of {lastResult.kind === 'focus' ? 'focused study' : 'rest'}{lastResult.xp > 0 && <> · <strong>+{lastResult.xp} XP</strong></>}</p>
            </div>
          )}

          {!running && (
            <div className="focus-subject">
              <label htmlFor="focus-subject">Studying (optional)</label>
              <select id="focus-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">— Pick a subject —</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </section>

        {/* Stats card */}
        <section className="pp-panel focus-stats-card">
          <h2 className="pp-section-title">Your focus</h2>
          <div className="pp-cards">
            <div className="pp-card pp-mint">
              <span className="pp-card-label">Today</span>
              <span className="pp-card-value">{focusMinutesToday}<small> min</small></span>
            </div>
            <div className="pp-card pp-violet">
              <span className="pp-card-label">Sessions today</span>
              <span className="pp-card-value">{completedToday}</span>
            </div>
            <div className="pp-card pp-coral">
              <span className="pp-card-label">Last 7 days</span>
              <span className="pp-card-value">{weekMinutes}<small> min</small></span>
            </div>
          </div>
          <div className="focus-tip">
            <h3>How it works</h3>
            <ul>
              <li>25 minutes of focus, then a 5-minute break — the classic Pomodoro.</li>
              <li>After 4 focus blocks, take a 15-minute long break.</li>
              <li>Every completed focus session earns XP and counts toward your streak.</li>
            </ul>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/flashcards')} style={{ marginTop: '12px' }}>
            Review flashcards instead
          </button>
        </section>
      </div>
    </div>
  );
}

export default FocusTimer;
