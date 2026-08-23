module.exports = {
  async up(db) {
    await db.collection('sync_history').createIndex(
      { status: 1 },
      {
        unique: true,
        partialFilterExpression: { status: 'running' },
        name: 'sync_history_running_lock',
      },
    );
  },

  async down(db) {
    await db.collection('sync_history').dropIndex('sync_history_running_lock');
  },
};
