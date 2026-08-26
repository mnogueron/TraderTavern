import { parseXtbOmiTables } from './xtb-omi.parser';

describe('parseXtbOmiTables', () => {
  it('parses rows following the header, keyed by column name rather than position', () => {
    const tables = [
      [
        ['Description', 'Symbol', 'ISIN', 'Currency'],
        ['Apple Inc.', 'AAPL.US', 'US0378331005', 'USD'],
        ['LVMH', 'MC.FR', 'FR0000121014', 'EUR'],
      ],
    ];

    expect(parseXtbOmiTables(tables)).toEqual([
      { isin: 'US0378331005', ticker: 'AAPL.US', name: 'Apple Inc.', currency: 'USD' },
      { isin: 'FR0000121014', ticker: 'MC.FR', name: 'LVMH', currency: 'EUR' },
    ]);
  });

  it('carries the header across multiple tables/pages', () => {
    const tables = [
      [
        ['Symbol', 'ISIN'],
        ['AAPL.US', 'US0378331005'],
      ],
      [['MC.FR', 'FR0000121014']],
    ];

    expect(parseXtbOmiTables(tables)).toEqual([
      { isin: 'US0378331005', ticker: 'AAPL.US', name: undefined, currency: undefined },
      { isin: 'FR0000121014', ticker: 'MC.FR', name: undefined, currency: undefined },
    ]);
  });

  it('skips rows with a malformed or missing ISIN', () => {
    const tables = [
      [
        ['Symbol', 'ISIN'],
        ['AAPL.US', 'not-an-isin'],
        ['MC.FR', ''],
        ['GOOGL.US', 'US02079K3059'],
      ],
    ];

    expect(parseXtbOmiTables(tables)).toEqual([
      { isin: 'US02079K3059', ticker: 'GOOGL.US', name: undefined, currency: undefined },
    ]);
  });

  it('returns an empty list when no header row is found', () => {
    const tables = [[['AAPL.US', 'US0378331005']]];

    expect(parseXtbOmiTables(tables)).toEqual([]);
  });
});
