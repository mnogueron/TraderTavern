// Strips diacritics (e.g. "é" -> "e") so ticker search can match regardless
// of accents on either side of the comparison (query or stored data). Mongo's
// $text `diacriticSensitive: false` default only folds accents for words the
// stemmer recognizes, so "société" typed as "societe" wouldn't otherwise
// match - this normalizes both the stored text and the search query the same
// way instead of relying on that.
export const stripDiacritics = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '');
