# Yahoo Finance rate limiter analysis

## Rate limiter

`YahooRateLimiterService` (`apps/api/src/shared/yahoo-rate-limiter.service.ts`)
serializes **every** Yahoo request (across ticker sync and ticker-source
resolution) through one shared queue: each call to `schedule()` is spaced at
least `YAHOO_REQUEST_DELAY_MS` apart via `nextAvailableAt`.

`YAHOO_REQUEST_DELAY_MS = 100` (`apps/api/src/finance/constants/candle-windows.ts:50`)
→ **10 req/sec**. On a 429 it backs off in-place (5s initial, ×2, capped at
5 min) rather than moving to the next ticker, and gives up with
`RateLimitCooldownError` if backoff exceeds the cap.

## Requests per ticker during a full sync (`syncTicker`, `ticker-sync.service.ts:1026`)

All requests go through the same shared queue, so total wall-clock time per
ticker ≈ (request count) × 100ms, plus any 429 backoff.

1. `fetchQuoteSummary` — `quoteSummary()` with 6 modules (price/summaryDetail/assetProfile/financialData/defaultKeyStatistics/earningsHistory) — **1 request**
2. `fetchDailyChart` — `chart()`, 1d interval, ~400-day lookback — **1 request**

   *(1 & 2 run via `Promise.all`, but still occupy 2 slots in the shared queue — no parallelism benefit on rate limit, only on other latency)*

3. `fetchFinancialHistory` → 3 parallel `fundamentalsTimeSeries()` calls (annual `financials`, `cash-flow`, `balance-sheet`) — **3 requests**
4. `fetchQuarterlyRevenueHistory` → `fundamentalsTimeSeries()` (quarterly `financials`) — **1 request**
5. `syncTechnical` → loops `CandleWindow` (`5m`, `1h`, `1d`, `1wk`), sequentially calling `fetchCandleChart` → `chart()` for each — **4 requests**

**Total: 10 Yahoo requests per ticker**, at ≥100ms apart on the shared
limiter → **≥1 second of throttled queue time per ticker**, before any DB
writes or 429 backoff.

Note: this is the full-sync path used for a single manual ticker sync
(`syncSingleTicker`) or a fresh ticker. The batch chunk-sync path
(`syncCompound`/`syncFundamental`, `ticker-sync.service.ts:1079-1095`) is
lighter — only steps 1+2 (2 requests) or step 1 alone (1 request)
respectively — so actual chunk-sync load per ticker is usually far below
10, unless it's a full sync.
