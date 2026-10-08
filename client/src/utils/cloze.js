/**
 * Client-side cloze helpers (ESM twin of server/utils/cloze.js).
 * Parses {{c1::answer}} / {{c1::answer::hint}} markup into render segments.
 * Original reimplementation — no third-party code copied.
 */

export function extractClozes(text) {
  const results = [];
  if (!text || typeof text !== 'string') return results;

  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('{{c', i);
    if (start === -1) break;

    const header = /^\{\{c(\d+)::/.exec(text.slice(start));
    if (!header) {
      i = start + 3;
      continue;
    }

    const ordinal = parseInt(header[1], 10);
    const j = start + header[0].length;

    let depth = 0;
    let end = -1;
    let k = j;
    while (k < text.length - 1) {
      if (text[k] === '{' && text[k + 1] === '{') {
        depth += 1;
        k += 2;
        continue;
      }
      if (text[k] === '}' && text[k + 1] === '}') {
        if (depth === 0) {
          end = k;
          break;
        }
        depth -= 1;
        k += 2;
        continue;
      }
      k += 1;
    }

    if (end === -1) {
      i = j;
      continue;
    }

    const inner = text.slice(j, end);
    const sep = inner.indexOf('::');
    const answer = (sep === -1 ? inner : inner.slice(0, sep)).trim();
    const hint = sep === -1 ? null : inner.slice(sep + 2).trim() || null;

    if (answer) {
      results.push({ ordinal, answer, hint, start, end: end + 2 });
    }
    i = end + 2;
  }

  return results;
}

export function hasCloze(text) {
  return extractClozes(text).length > 0;
}

/**
 * Segments for rendering one cloze card.
 * @param {string} text raw cloze text
 * @param {number} activeOrdinal the ordinal this card blanks out
 * @param {'front'|'back'} side
 * @returns {Array<{kind:'text'|'blank'|'revealed', value:string, ordinal?:number, hint?:string|null}>}
 */
export function clozeSegments(text, activeOrdinal, side = 'front') {
  const clozes = extractClozes(text);
  const segments = [];
  let cursor = 0;
  for (const c of clozes) {
    if (c.start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, c.start) });
    }
    if (side === 'front' && c.ordinal === activeOrdinal) {
      segments.push({ kind: 'blank', value: c.answer, ordinal: c.ordinal, hint: c.hint });
    } else {
      segments.push({ kind: 'revealed', value: c.answer, ordinal: c.ordinal });
    }
    cursor = c.end;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}
