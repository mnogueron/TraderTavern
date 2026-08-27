import { parseXtbOmiText } from './xtb-omi.parser';

describe('parseXtbOmiText', () => {
  it('parses stock rows (symbol, name, isin, currency, amount, hours, days)', () => {
    const text = [
      'Symbol Company Name ISIN Currency Minimum transaction value Trading Hours Trading Days',
      '12DA.DE Dell Technologies Inc US24703L2025 EUR 1 EUR 07:30 - 22:00 Monday - Friday',
      'ABX.US* CLOSE ONLY / Barrick Gold Corp CA0679011084 USD 1 USD 15:30 - 22:00 Monday - Friday',
    ].join('\n');

    expect(parseXtbOmiText(text)).toEqual([
      { isin: 'US24703L2025', ticker: '12DA.DE', name: 'Dell Technologies Inc', currency: 'EUR' },
      {
        isin: 'CA0679011084',
        ticker: 'ABX.US*',
        name: 'CLOSE ONLY / Barrick Gold Corp',
        currency: 'USD',
      },
    ]);
  });

  it('parses ETF/ETN/ETC rows, which carry an extra instrument-type column', () => {
    const text = [
      'Symbol Company Name ISIN Currency Minimum transaction value ETF, ETN, ETC Trading Hours Trading Days',
      '0LJI.DE WisdomTree EURO STOXX Banks 3x (Acc, EUR) IE00BLS09N40 EUR ETN 1 EUR 09:00 - 17:30 Monday - Friday',
    ].join('\n');

    expect(parseXtbOmiText(text)).toEqual([
      {
        isin: 'IE00BLS09N40',
        ticker: '0LJI.DE',
        name: 'WisdomTree EURO STOXX Banks 3x (Acc, EUR)',
        currency: 'EUR',
      },
    ]);
  });

  it('handles rows without proper trading hours (closed markets use "-")', () => {
    const text =
      'ATAD.UK* CLOSE ONLY / Tatneft PAO - ADR US8766292051 USD 1 USD - Monday - Friday';

    expect(parseXtbOmiText(text)).toEqual([
      {
        isin: 'US8766292051',
        ticker: 'ATAD.UK*',
        name: 'CLOSE ONLY / Tatneft PAO - ADR',
        currency: 'USD',
      },
    ]);
  });

  it('skips rows with a malformed or missing ISIN', () => {
    const text = [
      'AAPL.US Apple Inc. not-an-isin USD 1 USD 15:30 - 22:00 Monday - Friday',
      'GOOGL.US Alphabet Inc US02079K3059 USD 1 USD 15:30 - 22:00 Monday - Friday',
    ].join('\n');

    expect(parseXtbOmiText(text)).toEqual([
      { isin: 'US02079K3059', ticker: 'GOOGL.US', name: 'Alphabet Inc', currency: 'USD' },
    ]);
  });

  it('stops before the Fractional Rights section, ignoring its earlier mention in the table of contents', () => {
    const text = [
      'Specification Table Fractional Rights page 143',
      'AAPL.US Apple Inc. US0378331005 USD 1 USD 15:30 - 22:00 Monday - Friday',
      'Specification Table Fractional Rights',
      'AAPLF.US Apple Inc Fractional US0378331005 USD 0.01 USD 15:30 - 22:00 Monday - Friday',
    ].join('\n');

    expect(parseXtbOmiText(text)).toEqual([
      { isin: 'US0378331005', ticker: 'AAPL.US', name: 'Apple Inc.', currency: 'USD' },
    ]);
  });

  it('returns an empty list when no rows match', () => {
    expect(parseXtbOmiText('nothing to see here')).toEqual([]);
  });
});
