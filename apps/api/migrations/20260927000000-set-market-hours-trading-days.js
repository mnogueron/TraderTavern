const DEFAULT_TRADING_DAYS = [1, 2, 3, 4, 5];
const TRADING_DAYS_OVERRIDES = {
  TLV: [0, 1, 2, 3, 4], // Tel Aviv Stock Exchange: Sunday-Thursday
};

module.exports = {
  async up(db) {
    const collection = db.collection('market_hours');
    await collection.updateMany(
      {},
      { $set: { tradingDays: DEFAULT_TRADING_DAYS } },
    );
    for (const [market, tradingDays] of Object.entries(TRADING_DAYS_OVERRIDES)) {
      await collection.updateOne({ market }, { $set: { tradingDays } });
    }
  },

  async down(db) {
    await db.collection('market_hours').updateMany(
      {},
      { $unset: { tradingDays: '' } },
    );
  },
};
