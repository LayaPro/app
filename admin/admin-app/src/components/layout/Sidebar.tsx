import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { toggleSidebar } from '../../store/slices/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../utils/constants.js';
import { projectApi, proposalApi } from '../../services/api.js';
import styles from './Sidebar.module.css';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface MenuSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  isCollapsible: boolean;
  items?: MenuItem[];
  path?: string;
  badge?: string | number;
}

// Main Menu Items
const mainMenuItems: MenuSection[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    isCollapsible: false,
    path: ROUTES.DASHBOARD,
  },
  {
    id: 'todos',
    name: 'My Tasks',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    isCollapsible: false,
    path: '/todos',
  },
  {
    id: 'albums',
    name: 'Albums',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    isCollapsible: false,
    path: ROUTES.ALBUMS,
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    isCollapsible: false,
    path: ROUTES.PROJECTS,
  },
  {
    id: 'proposals',
    name: 'Proposals',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    isCollapsible: false,
    path: ROUTES.PROPOSALS,
  },
  {
    id: 'finances',
    name: 'Finances',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    isCollapsible: true,
    items: [
      { name: 'Overview', path: ROUTES.FINANCES_OVERVIEW, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
      { name: 'Customers', path: ROUTES.FINANCES_CUSTOMERS, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
      { name: 'Team Members', path: ROUTES.FINANCES_TEAM_MEMBERS, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
      { name: 'Expenses', path: ROUTES.FINANCES_EXPENSES, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    isCollapsible: true,
    items: [
      { name: 'Events List', path: ROUTES.CALENDAR_EVENTS_LIST, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg> },
      { name: 'Events Calendar', path: ROUTES.CALENDAR_EVENTS_CALENDAR, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    ],
  },
  {
    id: 'organization',
    name: 'My Organization',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    isCollapsible: true,
    items: [
      { name: 'Basic Details', path: ROUTES.ORGANIZATION_BASIC_DETAILS, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
      { name: 'Terms & Policies', path: ROUTES.ORGANIZATION_TERMS, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      { name: 'Deliverables', path: ROUTES.ORGANIZATION_DELIVERABLES, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    ],
  },
];

// Secondary Menu Items with collapsible sections
const secondaryMenuItems: MenuSection[] = [
  {
    id: 'workflow',
    name: 'Workflow Setup',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    isCollapsible: true,
    items: [
      { name: 'Events Setup', path: ROUTES.EVENTS_SETUP, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
      { name: 'Gallery Setup', path: ROUTES.GALLERY_SETUP, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
      { name: 'Projects Setup', path: ROUTES.PROJECTS_SETUP, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
    ],
  },
  {
    id: 'team',
    name: 'Team & Resources',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    isCollapsible: true,
    items: [
      { name: 'Team Members', path: ROUTES.TEAM_MEMBERS, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
      { name: 'Access Management', path: ROUTES.ACCESS_MANAGEMENT, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
      { name: 'Equipments', path: ROUTES.EQUIPMENTS, icon: <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    isCollapsible: false,
    path: ROUTES.STORAGE,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: (
      <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    isCollapsible: false,
    path: ROUTES.SETTINGS,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state: any) => state.ui);
  const { isAdmin } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [proposalCount, setProposalCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [projectsResponse, proposalsResponse] = await Promise.all([
          projectApi.getAll(),
          proposalApi.getAll()
        ]);
        setProjectCount(projectsResponse?.count || projectsResponse?.projects?.length || 0);
        setProposalCount(proposalsResponse?.count || proposalsResponse?.proposals?.length || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    if (isAdmin) {
      fetchCounts();
      // Removed auto-refresh polling - counts will update on navigation/refresh
    }
  }, [isAdmin]);

  // Filter menu items based on user role
  const visibleMainMenuItems = useMemo(() => {
    const items = mainMenuItems.map(item => {
      if (item.id === 'projects') {
        return { ...item, badge: projectCount > 0 ? projectCount : undefined };
      }
      if (item.id === 'proposals') {
        return { ...item, badge: proposalCount > 0 ? proposalCount : undefined };
      }
      return item;
    });

    if (isAdmin) {
      return items; // Admin sees all items
    }
    // User only sees Dashboard, My Tasks, Albums, Calendar
    return items.filter(item => 
      ['dashboard', 'todos', 'albums', 'calendar'].includes(item.id)
    );
  }, [isAdmin, projectCount, proposalCount]);

  const visibleSecondaryMenuItems = useMemo(() => {
    if (isAdmin) {
      return secondaryMenuItems; // Admin sees all items
    }
    // User only sees Storage and Settings
    return secondaryMenuItems.filter(item => ['storage', 'settings'].includes(item.id));
  }, [isAdmin]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? [] // Collapse if already open
        : [sectionId] // Open this one, close others (accordion)
    );
  };

  const isPathActive = (section: MenuSection): boolean => {
    // Normalize paths by removing trailing slashes for comparison
    const currentPath = location.pathname.replace(/\/$/, '') || '/';
    
    if (section.path) {
      const sectionPath = section.path.replace(/\/$/, '') || '/';
      return currentPath === sectionPath;
    }
    if (section.items) {
      return section.items.some(item => {
        const itemPath = item.path.replace(/\/$/, '') || '/';
        return currentPath === itemPath;
      });
    }
    return false;
  };

  const renderMenuItem = (section: MenuSection) => {
    const isActive = isPathActive(section);
    const isExpanded = expandedSections.includes(section.id);

    if (!section.isCollapsible && section.path) {
      // Simple menu item
      return (
        <li key={section.id}>
          <Link
            to={section.path}
            className={`${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            {section.icon}
            {!sidebarCollapsed && (
              <>
                <span className={styles.label}>{section.name}</span>
                {section.badge && (
                  <span className={styles.badge}>{section.badge}</span>
                )}
              </>
            )}
          </Link>
        </li>
      );
    }

    if (section.isCollapsible && section.items) {
      // Collapsible menu section
      return (
        <li 
          key={section.id} 
          className={styles.collapsibleSection}
          onMouseEnter={() => sidebarCollapsed && setHoveredSection(section.id)}
          onMouseLeave={() => sidebarCollapsed && setHoveredSection(null)}
        >
          <button
            onClick={() => !sidebarCollapsed && toggleSection(section.id)}
            className={`${styles.navLink} ${styles.collapsibleHeader} ${isActive ? styles.active : ''}`}
          >
            {section.icon}
            {!sidebarCollapsed && (
              <>
                <span className={styles.label}>{section.name}</span>
                <svg
                  className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
          
          {/* Popover for collapsed mode */}
          {sidebarCollapsed && hoveredSection === section.id && (
            <div 
              className={styles.popover}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <div className={styles.popoverHeader}>{section.name}</div>
              <ul className={styles.popoverList}>
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`${styles.popoverLink} ${location.pathname === item.path ? styles.active : ''}`}
                      onClick={() => setHoveredSection(null)}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Regular expanded submenu */}
          {!sidebarCollapsed && (
            <ul className={`${styles.subMenu} ${isExpanded ? styles.subMenuExpanded : ''}`}>
              {section.items.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`${styles.subNavLink} ${location.pathname === item.path ? styles.active : ''}`}
                  >
                    {item.icon}
                    <span className={styles.subLabel}>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    return null;
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <nav className={styles.nav}>
        {/* Main Menu */}
        <div className={styles.menuSection}>
          <ul className={styles.menuList}>
            {visibleMainMenuItems.map(renderMenuItem)}
          </ul>
        </div>

        {/* Divider */}
        {!sidebarCollapsed && (
          <div className={styles.dividerWrapper}>
            <div className={styles.divider}></div>
          </div>
        )}

        {/* Secondary Menu */}
        <div className={styles.menuSection}>
          <ul className={styles.menuList}>
            {visibleSecondaryMenuItems.map(renderMenuItem)}
          </ul>
        </div>
      </nav>

      {/* Collapse Button */}
      <div className={styles.collapseButtonWrapper}>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={styles.collapseButton}
        >
          <svg
            className={`${styles.collapseIcon} ${sidebarCollapsed ? styles.rotated : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
          {!sidebarCollapsed && (
            <span className={styles.collapseText}>Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
};
