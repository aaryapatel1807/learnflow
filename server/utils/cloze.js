/**
 * Cloze deletion parsing utilities.
 *
 * Supported syntax (Anki / obsidian-spaced-repetition compatible):
 *   {{c1::answer}}          — basic cloze, ordinal 1
 *   {{c1::answer::hint}}    — cloze with a hint shown inside the blank
 *   {{c2::other}}           — a second cloze in the same text
 *
 * One review card is generated per distinct ordinal (Anki behaviour): the
 * card for ordinal N blanks out every cN span and reveals all other spans.
 *
 * This is an original reimplementation of the widely-used cloze pattern
 * (MIT-licensed implementations such as obsidian-spaced-repetition served as
 * the behavioural reference). No third-party code is copied here.
 */

/**
 * Extract every cloze span from text.
 * @param {string} text
 * @returns {Array<{ordinal:number, answer:string, hint:string|null, start:number, end:number}>}
 */
function extractClozes(text) {
  const results = [];
  if (!text || typeof text !== 'string') return results;

  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('{{c', i);
    if (start === -1) break;

    const header = /^\{\{c(\d+)::/.exec(text.slice(start));
    if (!header) {
      i = start + 3; // not a cloze opener — skip past '{{c'
      continue;
    }

    const ordinal = parseInt(header[1], 10);
    let j = start + header[0].length;

    // Scan for the matching closing '}}', tolerating nested '{{...}}' pairs.
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
      i = j; // unclosed markup — skip it
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

/**
 * @param {string} text
 * @returns {boolean} true when the text contains at least one valid cloze span
 */
function hasCloze(text) {
  return extractClozes(text).length > 0;
}

/**
 * @param {string} text
 * @returns {number[]} sorted unique cloze ordinals present in the text
 */
function distinctOrdinals(text) {
  const ordinals = new Set(extractClozes(text).map((c) => c.ordinal));
  return [...ordinals].sort((a, b) => a - b);
}

/**
 * Render the front of a cloze card for the given active ordinal: the active
 * spans become blanks, every other span is revealed as plain text.
 * @param {string} text
 * @param {number} activeOrdinal
 * @returns {string}
 */
function renderClozeFront(text, activeOrdinal) {
  const clozes = extractClozes(text);
  if (clozes.length === 0) return text;

  let out = '';
  let cursor = 0;
  for (const c of clozes) {
    out += text.slice(cursor, c.start);
    out += c.ordinal === activeOrdinal ? `[${c.hint || '...'}]` : c.answer;
    cursor = c.end;
  }
  out += text.slice(cursor);
  return out;
}

/**
 * Render the back of a cloze card: every span revealed as plain text.
 * @param {string} text
 * @returns {string}
 */
function renderClozeBack(text) {
  const clozes = extractClozes(text);
  if (clozes.length === 0) return text;

  let out = '';
  let cursor = 0;
  for (const c of clozes) {
    out += text.slice(cursor, c.start);
    out += c.answer;
    cursor = c.end;
  }
  out += text.slice(cursor);
  return out;
}

/**
 * Build the segments a client needs to render one cloze card richly.
 * @param {string} text
 * @param {number} activeOrdinal
 * @returns {Array<{kind:'text'|'blank'|'revealed', value:string, ordinal?:number, hint?:string|null}>}
 */
function clozeSegments(text, activeOrdinal) {
  const clozes = extractClozes(text);
  const segments = [];
  let cursor = 0;
  for (const c of clozes) {
    if (c.start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, c.start) });
    }
    if (c.ordinal === activeOrdinal) {
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

module.exports = {
  extractClozes,
  hasCloze,
  distinctOrdinals,
  renderClozeFront,
  renderClozeBack,
  clozeSegments,
};
