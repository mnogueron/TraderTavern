module.exports = {
  async up(db) {
    // Backs the ticker_sources -> ticker_static_data $lookup in
    // getScreenerTickerOptions (the ticker search used by the screener's
    // Ticker filter and the admin trigger-sync dialogs), which was doing a
    // full collection scan per candidate without this index.
    await db
      .collection('ticker_static_data')
      .createIndex('isin', { unique: true, name: 'isin_unique' });

    await db
      .collection('ticker_sources')
      .createIndex(
        { isin: 1, source: 1 },
        { unique: true, name: 'isin_source_unique' },
      );
  },

  async down(db) {
    await db.collection('ticker_static_data').dropIndex('isin_unique');
    await db.collection('ticker_sources').dropIndex('isin_source_unique');
  },
};
