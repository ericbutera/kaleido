interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  visiblePages?: number;
}

export default function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  className = "",
  visiblePages = 5,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const handlePageClick = (p: number) => {
    if (p !== page && p >= 1 && p <= totalPages) {
      onPageChange(p);
    }
  };

  const renderPageButton = (p: number) => (
    <button
      key={p}
      className={`join-item btn ${p === page ? "btn-active" : ""}`}
      onClick={() => handlePageClick(p)}
    >
      {p}
    </button>
  );

  // Determine a sliding window of pages to show centered around currentPage
  const pagesToShow = Math.max(1, Math.min(visiblePages, totalPages));
  let start = page - Math.floor(pagesToShow / 2);
  if (start < 1) start = 1;
  let end = start + pagesToShow - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - pagesToShow + 1);
  }
  const rangeWithDots: Array<number> = [];
  for (let i = start; i <= end; i++) rangeWithDots.push(i);

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="join">
        <button
          className="join-item btn"
          disabled={page === 1}
          onClick={() => handlePageClick(page - 1)}
        >
          «
        </button>

        {rangeWithDots.map((p) => renderPageButton(p))}

        <button
          className="join-item btn"
          disabled={page === totalPages}
          onClick={() => handlePageClick(page + 1)}
        >
          »
        </button>
      </div>
    </div>
  );
}
