# Current limitations

## Ticker search is not scalable

`FinanceService.getScreenerTickerOptions` (`apps/api/src/finance/finance.service.ts`), which
backs both the Screener's ticker filter and the watchlist "Add ticker" dialog, loads the user's
entire ticker universe for their `tickerSource` (several thousand documents) into memory on
every search request, then ranks it in application code (substring match, with a `fuse.js`
fuzzy fallback for typos).

This gives good relevance (exact/prefix/substring matches ranked before fuzzy matches) but does
not scale: every keystroke re-fetches and re-scores the full candidate set instead of querying
an index. It is noticeably slower than the previous DB-side regex search, especially as the
ticker universe grows.

If this becomes a bottleneck, consider a proper search index (e.g. MongoDB Atlas Search, or a
dedicated search engine) instead of in-memory ranking.
