const bcrypt = require('bcryptjs');

module.exports = {
  async up(db) {
    const existing = await db.collection('users').findOne({
      username: 'admin',
    });

    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash('admin', 10);

    await db.collection('users').insertOne({
      username: 'admin',
      email: 'admin@tradertavern.local',
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async down(db) {
    await db.collection('users').deleteOne({ username: 'admin' });
  },
};
