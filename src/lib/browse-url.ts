/** Build query string for browse pages (movies / tv-shows). Omits empty values. */
export function buildBrowseQuery(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    const s = String(v);
    if (!s.trim()) return;
    u.set(k, s);
  });
  const q = u.toString();
  return q ? `?${q}` : '';
}
