module.exports = {
  async up(db) {
    await db
      .collection('users')
      .createIndex('username', { unique: true, name: 'username_unique' });
    await db
      .collection('users')
      .createIndex('email', { unique: true, name: 'email_unique' });
  },

  async down(db) {
    await db.collection('users').dropIndex('username_unique');
    await db.collection('users').dropIndex('email_unique');
  },
};
