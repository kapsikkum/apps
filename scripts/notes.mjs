// Turns a GitHub release body into the plain "What's new" text SideStore shows for a version: no markdown
// headings, no install boilerplate, no pull request links.
const SKIP_SECTIONS = /^(mudrix web\b|new contributors)/i;

export function cleanNotes(body, limit = 4000) {
  const sections = [{ title: '', lines: [] }];
  for (const raw of (body || '').replaceAll('\r', '').split('\n')) {
    const heading = /^#{1,6}\s+(.*\S)\s*$/.exec(raw);
    if (heading) sections.push({ title: heading[1].replace(/:$/, ''), lines: [] });
    else sections.at(-1).lines.push(raw);
  }

  // A rolling release's body keeps every build's notes, so the same section can come round again:
  // sections of one name are merged and a line is shown once.
  const merged = new Map();
  for (const { title, lines } of sections) {
    if (SKIP_SECTIONS.test(title)) continue;
    const items = merged.get(title) ?? new Set();
    merged.set(title, items);
    for (const raw of lines) {
      const line = raw
        .replace(/\s+by @\S+ in https?:\/\/\S+$/, '') // GitHub's generated "by @who in <pull request>"
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .trim();
      if (!line || /^full changelog\b/i.test(line)) continue;
      items.add(/^[-*]\s+/.test(line) ? `• ${line.replace(/^[-*]\s+/, '')}` : line);
    }
  }
  const out = [...merged]
    .filter(([, items]) => items.size)
    .map(([title, items]) => [title, ...items].filter(Boolean).join('\n'));

  const text = out.join('\n\n');
  if (text.length <= limit) return text;
  // Cut at a line, not in the middle of a sentence
  const kept = text.slice(0, limit).split('\n').slice(0, -1).join('\n').trimEnd();
  return `${kept}\n• …and more, see the release on GitHub`;
}
