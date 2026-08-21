const MARKETS = [
  {
    market: 'NMS',
    label: 'NASDAQ',
    timezone: 'America/New_York',
    preMarketOpen: '04:00',
    regularOpen: '09:30',
    regularClose: '16:00',
    postMarketClose: '20:00',
  },
  {
    market: 'NYQ',
    label: 'New York Stock Exchange',
    timezone: 'America/New_York',
    preMarketOpen: '04:00',
    regularOpen: '09:30',
    regularClose: '16:00',
    postMarketClose: '20:00',
  },
  {
    market: 'PAR',
    label: 'Euronext Paris',
    timezone: 'Europe/Paris',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'GER',
    label: 'XETRA',
    timezone: 'Europe/Berlin',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'EBS',
    label: 'SIX Swiss Exchange',
    timezone: 'Europe/Zurich',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'LSE',
    label: 'London Stock Exchange',
    timezone: 'Europe/London',
    regularOpen: '08:00',
    regularClose: '16:30',
  },
  {
    market: 'AMS',
    label: 'Euronext Amsterdam',
    timezone: 'Europe/Amsterdam',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'MCE',
    label: 'Bolsa de Madrid',
    timezone: 'Europe/Madrid',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'MIL',
    label: 'Borsa Italiana',
    timezone: 'Europe/Rome',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'CPH',
    label: 'Nasdaq Copenhagen',
    timezone: 'Europe/Copenhagen',
    regularOpen: '09:00',
    regularClose: '17:00',
  },
  {
    market: 'STO',
    label: 'Nasdaq Stockholm',
    timezone: 'Europe/Stockholm',
    regularOpen: '09:00',
    regularClose: '17:30',
  },
  {
    market: 'OSL',
    label: 'Oslo Børs',
    timezone: 'Europe/Oslo',
    regularOpen: '09:00',
    regularClose: '16:20',
  },
  {
    market: 'HEL',
    label: 'Nasdaq Helsinki',
    timezone: 'Europe/Helsinki',
    regularOpen: '10:00',
    regularClose: '18:30',
  },
];

module.exports = {
  async up(db) {
    for (const entry of MARKETS) {
      await db.collection('market_hours').updateOne(
        { market: entry.market },
        {
          $set: {
            ...entry,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
    }
  },

  async down(db) {
    await db.collection('market_hours').deleteMany({
      market: { $in: MARKETS.map((entry) => entry.market) },
    });
  },
};
