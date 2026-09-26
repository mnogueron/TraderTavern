module.exports = {
  async up(db) {
    const collection = db.collection('sync_history');
    await collection.updateMany({ market: { $ne: null } }, [
      { $set: { markets: [{ $ifNull: ['$market', null] }] } },
    ]);
    await collection.updateMany(
      { market: null },
      { $set: { markets: [] } },
    );
    await collection.updateMany({}, { $unset: { market: '' } });
  },

  async down(db) {
    const collection = db.collection('sync_history');
    await collection.updateMany({}, [
      {
        $set: {
          market: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$markets', []] } }, 0] },
              { $arrayElemAt: ['$markets', 0] },
              null,
            ],
          },
        },
      },
    ]);
    await collection.updateMany({}, { $unset: { markets: '' } });
  },
};
