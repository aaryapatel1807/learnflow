import { useMemo } from 'react';
import './StudyHeatmap.css';

/**
 * GitHub-style study activity heatmap (pattern: shadcn-calendar-heatmap,
 * reimplemented dependency-free in the pastel palette).
 *
 * Props:
 *  - activity: { 'YYYY-MM-DD': count } XP-action counts (from /api/calendar)
 *  - focus:    { 'YYYY-MM-DD': minutes } focus minutes (from /api/study/stats)
 *  - weeks:    number of week columns to render (default 16)
 */
function StudyHeatmap({ activity = {}, focus = {}, weeks = 16 }) {
  const { columns, monthLabels, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Align the grid so the last column ends today; rows run Mon..Sun.
    const totalDays = weeks * 7;
    const start = new Date(today);
    start.setDate(start.getDate() - (totalDays - 1));
    // Rewind to the Monday of the start week for clean columns.
    const dow = (start.getDay() + 6) % 7; // Mon=0
    start.setDate(start.getDate() - dow);

    const cols = [];
    const labels = [];
    let runningTotal = 0;
    let lastMonth = -1;
    const cursor = new Date(start);
    for (let w = 0; w < weeks + 1; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().split('T')[0];
        const inFuture = cursor > today;
        const score = inFuture ? null : (activity[key] || 0) + (focus[key] || 0) / 10;
        if (!inFuture) runningTotal += activity[key] || 0;
        col.push({ key, score, inFuture, month: cursor.getMonth(), day: cursor.getDate() });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
      const firstOfCol = col[0];
      if (firstOfCol.month !== lastMonth && !firstOfCol.inFuture) {
        labels.push({ weekIndex: w, label: firstOfCol.key.slice(5, 7) === '01' ? '' : monthName(firstOfCol.month) });
        lastMonth = firstOfCol.month;
      } else {
        labels.push(null);
      }
    }
    return { columns: cols, monthLabels: labels, total: runningTotal };
  }, [activity, focus, weeks]);

  return (
    <div className="hm-wrap">
      <div className="hm-head">
        <h3>Study heatmap</h3>
        <span className="pp-count">{total} actions · last {weeks} weeks</span>
      </div>
      <div className="hm-scroll">
        <div className="hm-months" aria-hidden="true">
          {monthLabels.map((m, i) => (
            <span key={i} className="hm-month">{m ? m.label : ''}</span>
          ))}
        </div>
        <div className="hm-grid" role="img" aria-label={`Study activity heatmap, ${total} actions in the last ${weeks} weeks`}>
          {columns.map((col, wi) => (
            <div key={wi} className="hm-col">
              {col.map((cell) => (
                <span
                  key={cell.key}
                  title={cell.inFuture ? '' : `${cell.key}: ${activity[cell.key] || 0} actions${focus[cell.key] ? `, ${focus[cell.key]} focus min` : ''}`}
                  className={`hm-cell ${cell.inFuture ? 'hm-future' : `hm-l${level(cell.score)}`}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="hm-legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`hm-cell hm-l${l} hm-legend-cell`} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function level(score) {
  if (!score || score <= 0) return 0;
  if (score < 2) return 1;
  if (score < 5) return 2;
  if (score < 10) return 3;
  return 4;
}

function monthName(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];
}

export default StudyHeatmap;
