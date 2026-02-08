import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchApi } from '../../services/api';
import styles from './SearchResults.module.css';

interface SearchResult {
  id: string;
  type: 'proposal' | 'project' | 'event' | 'team' | 'equipment' | 'image';
  title: string;
  subtitle?: string;
  metadata?: any;
  url?: string;
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  breakdown: {
    proposals: number;
    projects: number;
    events: number;
    team: number;
    equipment: number;
    images: number;
    eventTypes: number;
    profiles: number;
  };
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [breakdown, setBreakdown] = useState<SearchResponse['breakdown'] | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (query.length >= 2) {
      setCurrentPage(1); // Reset to page 1 when query or filter changes
      performSearch(1);
    }
  }, [query, selectedFilter]);

  useEffect(() => {
    if (query.length >= 2 && currentPage > 1) {
      performSearch(currentPage);
    }
  }, [currentPage]);

  const performSearch = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await searchApi.global(query, { 
        limit: itemsPerPage, 
        page,
        type: selectedFilter 
      });
      console.log('Search response:', response);
      console.log('Results with types:', response.results?.map((r: any) => ({ id: r.id, type: r.type, title: r.title })));
      setResults(response.results || []);
      setTotalResults(response.totalResults || 0);
      setBreakdown(response.breakdown || null);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // No client-side filtering needed - results come filtered from backend
  const filteredResults = results;

  const getFilteredCount = () => {
    if (selectedFilter === 'all') return totalResults;
    if (!breakdown) return totalResults;
    
    const countMap: Record<string, number> = {
      'proposal': breakdown.proposals,
      'project': breakdown.projects,
      'event': breakdown.events,
      'team': breakdown.team,
      'equipment': breakdown.equipment,
      'image': breakdown.images
    };
    
    return countMap[selectedFilter] || totalResults;
  };

  const displayTotal = selectedFilter === 'all' ? totalResults : getFilteredCount();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'proposal':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'project':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'event':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'team':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'equipment':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'image':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      proposal: 'Proposal',
      project: 'Project',
      event: 'Event',
      team: 'Team Member',
      equipment: 'Equipment',
      image: 'Image'
    };
    return labels[type] || type;
  };

  if (!query) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="64" height="64">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2>No search query provided</h2>
          <p>Please enter a search term to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className={styles.mainCard}>
        <div className={styles.searchInfo}>
          <div className={styles.searchHeader}>
            <div>
              <h1>Search Results</h1>
              <p>
                {loading ? 'Searching...' : `${displayTotal} result${displayTotal !== 1 ? 's' : ''} found for "${query}"`}
              </p>
            </div>
            {!loading && filteredResults.length > 0 && displayTotal > itemsPerPage && (
              <div className={styles.topPagination}>
                <button
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className={styles.paginationInfo}>
                  <span className={styles.pageNumber}>Page {currentPage} of {Math.ceil(displayTotal / itemsPerPage)}</span>
                  <span className={styles.resultRange}>
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displayTotal)} of {displayTotal}
                  </span>
                </div>
                
                <button
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(displayTotal / itemsPerPage)}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {breakdown && (
          <div className={styles.filters}>
            <button
              className={`${styles.filterButton} ${selectedFilter === 'all' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All ({totalResults})
            </button>
          {breakdown.proposals > 0 && (
            <button
              className={`${styles.filterButton} ${selectedFilter === 'proposal' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('proposal')}
            >
              Proposals ({breakdown.proposals})
            </button>
          )}
          {breakdown.projects > 0 && (
            <button
              className={`${styles.filterButton} ${selectedFilter === 'project' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('project')}
            >
              Projects ({breakdown.projects})
            </button>
          )}
          {breakdown.events > 0 && (
            <button
              className={`${styles.filterButton} ${selectedFilter === 'event' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('event')}
            >
              Events ({breakdown.events})
            </button>
          )}
          {breakdown.team > 0 && (
            <button
              className={`${styles.filterButton} ${selectedFilter === 'team' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('team')}
            >
              Team ({breakdown.team})
            </button>
          )}
          {breakdown.equipment > 0 && (
            <button
              className={`${styles.filterButton} ${selectedFilter === 'equipment' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('equipment')}
            >
              Equipment ({breakdown.equipment})
            </button>
          )}
          {breakdown.images > 0 && (
            <button
              className={`${styles.filterButton} ${selectedFilter === 'image' ? styles.active : ''}`}
              onClick={() => setSelectedFilter('image')}
            >
              Images ({breakdown.images})
            </button>
          )}
          </div>
        )}

        <div className={styles.divider}></div>

        {loading ? (
          <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading results...</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <div key={currentPage} className={styles.resultsList}>
          {filteredResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className={styles.resultCard}
              onClick={() => result.url && navigate(result.url)}
            >
              {result.type === 'image' && result.metadata?.imageUrl ? (
                <div className={styles.resultImagePreview}>
                  <img src={result.metadata.imageUrl} alt={result.title} />
                </div>
              ) : (
                <div className={styles.resultIcon}>
                  {getTypeIcon(result.type)}
                </div>
              )}
              <div className={styles.resultContent}>
                <div className={styles.resultHeader}>
                  <h3>
                    {result.title}
                    <span className={styles.resultType}>{getTypeLabel(result.type)}</span>
                  </h3>
                </div>
                {result.subtitle && (
                  <p className={styles.resultSubtitle}>{result.subtitle}</p>
                )}
              </div>
              <div className={styles.resultAction}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="64" height="64">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2>No results found</h2>
          <p>
            {selectedFilter !== 'all' 
              ? `No ${selectedFilter} results found on this page. Try changing the page or removing the filter.`
              : 'Try adjusting your search terms'
            }
          </p>
        </div>
      )}

      {!loading && filteredResults.length > 0 && displayTotal > itemsPerPage && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <div className={styles.paginationInfo}>
            <span className={styles.pageNumber}>Page {currentPage} of {Math.ceil(displayTotal / itemsPerPage)}</span>
            <span className={styles.resultRange}>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displayTotal)} of {displayTotal}
            </span>
          </div>
          
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(displayTotal / itemsPerPage)}
          >
            Next
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default SearchResults;
