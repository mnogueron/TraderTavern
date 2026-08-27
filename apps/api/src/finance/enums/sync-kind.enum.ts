// Discriminates which per-ticker sync operation a sync_history chunk
// belongs to, so e.g. a "static" chunk and a "technical" chunk covering the
// same tickers don't collide on the same chunkHash lock.
export enum SyncKind {
  Ticker = 'ticker',
  Static = 'static',
  Fundamental = 'fundamental',
  Compound = 'compound',
  Technical = 'technical',
}
