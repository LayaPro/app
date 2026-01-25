import styles from './TableSkeleton.module.css';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showFilters?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 10, 
  columns = 6,
  showFilters = false 
}) => {
  return (
    <div className={styles.tableContainer}>
      {/* Toolbar with Search and Filters */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchSkeleton} />
          {showFilters && <div className={styles.filterSkeleton} />}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className={styles.th}>
                  <div className={styles.headerSkeleton} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className={styles.tr}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className={styles.td}>
                    <div 
                      className={styles.cellSkeleton}
                      style={{ 
                        width: colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40px' : '80%',
                        animationDelay: `${(rowIndex * 0.05 + colIndex * 0.02)}s`
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className={styles.paginationSkeleton}>
        <div className={styles.paginationInfo} />
        <div className={styles.paginationControls}>
          <div className={styles.paginationButton} />
          <div className={styles.paginationButton} />
          <div className={styles.paginationButton} />
        </div>
      </div>
    </div>
  );
};
