# News list — source investigation

**Status:** Investigated, not implemented (deferred).

## Requirements considered

- A News page showing a feed of headlines across the tickers we track: ticker, headline, published time.
- Infinite "load more" (button at the bottom of the page) instead of classic pagination.
- A news section on the ticker detail page showing recent news for that specific ticker.
- No persistence — news is not stored in the DB, it's fetched live.

## Options considered

- **Legacy Yahoo Finance RSS feed** (`feeds.finance.yahoo.com/rss/2.0/headline?s=<ticker>`) — confirmed dead (404) as of this investigation. Not usable.
- **Yahoo Finance internal search endpoint** (`query1.finance.yahoo.com/v1/finance/search?q=<ticker>&newsCount=N`) — confirmed working via curl. Returns `title`, `publisher`, `link`, `providerPublishTime` (unix timestamp), and `relatedTickers` per article — matches the ticker/headline/published-time requirement directly. Undocumented/unofficial (could change or break without notice), but the app already depends on `yahoo-finance2`, which wraps this exact endpoint via its `search` module (confirmed the module and its schema include `news`, `title`, `publisher`, `providerPublishTime`, `relatedTickers`). The app also already has a `YahooRateLimiterService` in place for calling Yahoo endpoints, which this would reuse.
- **Google News RSS** (`news.google.com/rss/search?q=<ticker>+stock`) — no API key needed, more resilient long-term (Google is less likely to kill a public RSS endpoint than an internal finance API), but far less structured: no explicit ticker tagging, generic titles/sources, would need per-article heuristics to associate a headline back to a ticker.
- **NewsAPI.org** — requires an API key and has a very low free-tier quota (100 requests/day), not viable for a live, unstored, per-request news page.
- **Alpha Vantage `NEWS_SENTIMENT`** — ticker-tagged news with sentiment, headline, and published time; shape matches requirements well, but Alpha Vantage's free tier is heavily rate-limited (25 requests/day), which would bottleneck both the global feed and per-ticker sections.

## Recommendation

Use `yahoo-finance2`'s existing `search()` module (already a dependency, already rate-limited via `YahooRateLimiterService`) for both the per-ticker news section and the global news page — no new API key or dependency needed.

**Key open question — scope of the global feed:** Yahoo's search endpoint is per-symbol; there's no "all tickers at once" firehose. Fetching news live for the entire ticker universe (several thousand tickers) on every page load/"load more" click isn't practical. The global news page should be scoped to something bounded — most likely the user's **watchlist tickers** (query each in parallel, rate-limited, merge and sort by `providerPublishTime`) — rather than literally every ticker the app tracks. This needs to be decided before implementation starts.

## Not implemented

This was investigation only, per explicit instruction to defer implementation. Kept here so the research doesn't need to be redone later.
