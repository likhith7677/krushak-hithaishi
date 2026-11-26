// Scan history is opt-in and stays ONLY in this browser.
// We intentionally do not save the uploaded leaf photo or GPS coordinates.
export type SavedScan = {
  id: string;
  date: string;
  crop: string;
  prediction: string;
  confidence: number | null;
  status: string;
  model: string;
};
const KEY = 'kh-consented-scan-history-v1';
export function readScans(): SavedScan[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed:unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as SavedScan[]).slice(0,50) : [];
  } catch { return []; }
}
export function saveScan(scan: SavedScan) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify([scan,...readScans()].slice(0,50)));
}
export function deleteScan(id:string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(readScans().filter(x=>x.id!==id)));
}
