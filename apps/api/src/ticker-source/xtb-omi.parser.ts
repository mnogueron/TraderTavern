// Parses XTB's quarterly "Specification Table Organised Market Instruments
// (OMI)" PDF into ISIN -> XTB symbol rows. The PDF is a plain table (one
// header row, one row per instrument) that repeats across pages without
// re-printing the header on every page, so callers pass every extracted
// table (in document order) and the header is only searched for once.

// ISO 6166: 2-letter country code + 9 alphanumeric chars + 1 check digit.
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

const HEADER_ALIASES = {
  isin: ['isin'],
  ticker: ['symbol', 'ticker', 'instrument symbol'],
  name: ['description', 'name', 'instrument', 'instrument name'],
  currency: ['currency', 'ccy'],
} as const;

type ColumnKey = keyof typeof HEADER_ALIASES;

export type XtbOmiRow = {
  isin: string;
  ticker: string;
  name?: string;
  currency?: string;
};

const normalizeCell = (cell: unknown): string =>
  typeof cell === 'string' ? cell.trim() : '';

const findHeaderColumns = (
  row: string[],
): Partial<Record<ColumnKey, number>> | null => {
  const normalized = row.map((cell) => cell.toLowerCase().trim());
  const columns: Partial<Record<ColumnKey, number>> = {};

  for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [
    ColumnKey,
    readonly string[],
  ][]) {
    const index = normalized.findIndex((cell) => aliases.includes(cell));
    if (index !== -1) {
      columns[key] = index;
    }
  }

  // A real header row must at least identify the ISIN and ticker columns;
  // anything less is just a normal data/description row that happens to
  // contain one of the alias words.
  return columns.isin != null && columns.ticker != null ? columns : null;
};

export const parseXtbOmiTables = (tables: string[][][]): XtbOmiRow[] => {
  const rows: XtbOmiRow[] = [];
  let columns: Partial<Record<ColumnKey, number>> | null = null;

  for (const table of tables) {
    for (const rawRow of table) {
      const row = rawRow.map(normalizeCell);

      if (!columns) {
        columns = findHeaderColumns(row);
        continue;
      }

      const isin = columns.isin != null ? row[columns.isin] : undefined;
      const ticker = columns.ticker != null ? row[columns.ticker] : undefined;
      if (!isin || !ticker || !ISIN_PATTERN.test(isin)) {
        continue;
      }

      rows.push({
        isin,
        ticker,
        name: columns.name != null ? row[columns.name] || undefined : undefined,
        currency:
          columns.currency != null ? row[columns.currency] || undefined : undefined,
      });
    }
  }

  return rows;
};
