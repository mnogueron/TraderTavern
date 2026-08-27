// Parses XTB's quarterly "Specification Table Organised Market Instruments
// (OMI)" PDF into ISIN -> XTB symbol rows.
//
// The PDF is exported from Excel and carries no vector-drawn table grid, so
// pdf-parse's `getTable()` (which relies on detecting drawn rectangles/lines)
// cannot read it. Instead we work off the plain extracted text: each
// instrument is one line of the form
//   SYMBOL  NAME  ISIN  CURRENCY  [ETF|ETN|ETC]  AMOUNT  CURRENCY  [HOURS]  DAYS
// (the `[ETF|ETN|ETC]` type column only appears in the "ETF, ETN, ETC"
// section, not the "Stocks" section) and everything after the row's own ISIN
// + currency is irrelevant to us, so it's matched loosely rather than fully
// parsed.

// ISO 6166: 2-letter country code + 9 alphanumeric chars + 1 check digit.
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

const ROW_PATTERN =
  /^(\S+)\s+(.+?)\s+([A-Z]{2}[A-Z0-9]{9}\d)\s+([A-Z]{3})\s+(?:(?:ETF|ETN|ETC)\s+)?[\d.,]+\s+[A-Z]{3}(?:\s+(?:\d{2}:\d{2}\s*-\s*\d{2}:\d{2}|-))?\s+.+$/;

// The document also lists "Fractional Rights" (derivative instruments
// referencing the OMI ones above, sharing a similar-looking row layout) in a
// section that starts with this heading; we stop before it since those
// aren't directly tradeable OMI instruments. The same phrase also appears
// once earlier, as an entry in the document's table of contents, so we
// anchor on its *last* occurrence (the section heading itself) rather than
// the first.
const FRACTIONAL_RIGHTS_MARKER = 'Specification Table Fractional Rights';

export type XtbOmiRow = {
  isin: string;
  ticker: string;
  name?: string;
  currency?: string;
};

export const parseXtbOmiText = (text: string): XtbOmiRow[] => {
  const rows: XtbOmiRow[] = [];
  const fractionalRightsIndex = text.lastIndexOf(FRACTIONAL_RIGHTS_MARKER);
  const relevantText =
    fractionalRightsIndex === -1 ? text : text.slice(0, fractionalRightsIndex);

  for (const line of relevantText.split('\n')) {
    const match = ROW_PATTERN.exec(line.trim());
    if (!match) {
      continue;
    }

    const [, ticker, name, isin, currency] = match;
    if (!ISIN_PATTERN.test(isin)) {
      continue;
    }

    rows.push({ isin, ticker, name: name.trim() || undefined, currency });
  }

  return rows;
};
