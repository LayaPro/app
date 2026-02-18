import React, { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  sortFn?: (a: T, b: T) => number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  itemsPerPage?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onCreateClick?: () => void;
  createButtonText?: string;
  renderExpandedRow?: (row: T) => React.ReactNode;
  getRowKey?: (row: T) => string;
  customFilters?: React.ReactNode;
  customActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  title?: string;
  titleIcon?: React.ReactNode;
  // Server-side pagination props
  serverSide?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  // Controlled search props
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideSearch?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  emptyIcon = (
    <img 
      src="/nodata.svg" 
      alt="No data" 
      style={{ width: '120px', height: '120px', opacity: 0.5, marginBottom: '16px' }}
    />
  ),
  onCreateClick,
  createButtonText = 'Create New',
  renderExpandedRow,
  getRowKey,
  customFilters,
  customActions,
  onRowClick,
  serverSide = false,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  totalItems: externalTotalItems,
  onPageChange: externalOnPageChange,
  searchValue,
  onSearchChange,
  title,
  titleIcon,
  hideSearch = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Use controlled search if provided, otherwise internal state
  const activeSearchTerm = searchValue !== undefined ? searchValue : searchTerm;
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setSearchTerm(value);
    }
  };

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Filter data - search across all columns (skip if server-side)
  const filteredData = useMemo(() => {
    if (serverSide) return data; // Server handles filtering
    if (!activeSearchTerm) return data;
    
    return data.filter(row => {
      return Object.entries(row).some(([_, value]) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(activeSearchTerm.toLowerCase());
      });
    });
  }, [data, activeSearchTerm, serverSide]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    // Find the column to check for custom sortFn
    const column = columns.find(col => String(col.key) === String(sortConfig.key));

    return [...filteredData].sort((a, b) => {
      // Use custom sort function if provided
      if (column?.sortFn) {
        const result = column.sortFn(a, b);
        return sortConfig.direction === 'asc' ? result : -result;
      }

      // Default sorting logic
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined - put them at the end
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue === bValue) return 0;

      // Case-insensitive comparison for strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase() < bValue.toLowerCase() ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagination
  const activePage = serverSide ? (externalCurrentPage || 1) : currentPage;
  const activeTotalPages = serverSide ? (externalTotalPages || 1) : Math.ceil(sortedData.length / itemsPerPage);
  const activeTotalItems = serverSide ? (externalTotalItems || data.length) : sortedData.length;
  
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = serverSide ? data : sortedData.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    if (!serverSide) {
      setCurrentPage(1);
    }
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const handlePageChange = (page: number) => {
    if (serverSide && externalOnPageChange) {
      externalOnPageChange(Math.max(1, Math.min(page, activeTotalPages)));
    } else {
      setCurrentPage(Math.max(1, Math.min(page, activeTotalPages)));
    }
  };

  return (
    <div className={styles.tableContainer}>
      {/* Toolbar with Search, Sort, and Create Button */}
      <div className={styles.toolbar}>
        {title && (
          <h2 className={styles.tableTitle}>
            {titleIcon}
            {title}
          </h2>
        )}
        {(!hideSearch || customFilters) && (
          <div className={styles.toolbarLeft}>
            {!hideSearch && (
              <div className={styles.searchContainer}>
                <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={activeSearchTerm}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    if (!serverSide) {
                      setCurrentPage(1);
                    }
                  }}
                  className={styles.searchInput}
                />
                {activeSearchTerm && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className={styles.clearButton}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {customFilters}
          </div>
        )}
        
        {customActions}
        
        {onCreateClick && (
          <button onClick={onCreateClick} className={styles.createButton}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {createButtonText}
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {renderExpandedRow && <th className={styles.thExpand}></th>}
              {columns.map((column, index) => (
                <th key={index} className={styles.th}>
                  <div className={styles.thContent}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(column.key as string)}
                        className={styles.sortButton}
                      >
                        <svg
                          className={`${styles.sortIcon} ${
                            sortConfig?.key === column.key
                              ? sortConfig.direction === 'asc'
                                ? styles.sortAsc
                                : styles.sortDesc
                              : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <div className={styles.emptyState}>
                    {emptyIcon}
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowKey = getRowKey ? getRowKey(row) : String(rowIndex);
                const isExpanded = expandedRows.has(rowKey);
                return (
                  <React.Fragment key={rowKey}>
                    <tr 
                      className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on buttons or interactive elements
                        if (onRowClick && !(e.target as HTMLElement).closest('button')) {
                          onRowClick(row);
                        }
                      }}
                    >
                      {renderExpandedRow && (
                        <td className={styles.tdExpand}>
                          <button
                            className={styles.expandButton}
                            onClick={() => toggleRow(rowKey)}
                          >
                            <svg
                              className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className={styles.td}>
                          {column.render
                            ? column.render(row)
                            : String(row[column.key as keyof T] || '-')}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={columns.length + 1} className={styles.expandedCell}>
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {activeTotalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {startIndex + 1} to {Math.min(endIndex, activeTotalItems)} of {activeTotalItems} entries
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className={styles.pageButton}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {[...Array(activeTotalPages)].map((_, index) => {
              const page = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === activeTotalPages ||
                (page >= activePage - 1 && page <= activePage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`${styles.pageButton} ${
                      activePage === page ? styles.pageButtonActive : ''
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === activePage - 2 || page === activePage + 2) {
                return <span key={page} className={styles.ellipsis}>...</span>;
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === activeTotalPages}
              className={styles.pageButton}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
