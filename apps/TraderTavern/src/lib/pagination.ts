// Always show the first/last page and the 2 pages around the current one,
// collapsing any gap into an ellipsis.
const SIBLING_COUNT = 2;

export const getPageNumbers = (
  page: number,
  totalPages: number,
): (number | 'ellipsis')[] => {
  const visiblePages = new Set(
    [
      1,
      totalPages,
      ...Array.from(
        { length: SIBLING_COUNT * 2 + 1 },
        (_, index) => page - SIBLING_COUNT + index,
      ),
    ].filter((candidate) => candidate >= 1 && candidate <= totalPages),
  );

  const pages: (number | 'ellipsis')[] = [];
  let previousPage: number | undefined;
  for (const pageNumber of Array.from(visiblePages).sort((a, b) => a - b)) {
    if (previousPage !== undefined && pageNumber - previousPage > 1) {
      pages.push('ellipsis');
    }
    pages.push(pageNumber);
    previousPage = pageNumber;
  }

  return pages;
};
