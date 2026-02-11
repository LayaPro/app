import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { toggleMobileMenu } from '../../store/slices/uiSlice.js';
import { useTheme } from '../../hooks/useTheme.js';
import { ROUTES } from '../../utils/constants.js';
import { projectApi, proposalApi } from '../../services/api.js';
import styles from './MobileMenuDrawer.module.css';

export const MobileMenuDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const { toggle: toggleTheme, isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

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

    if (isOpen) {
      fetchCounts();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      dispatch(toggleMobileMenu());
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        data-closing={isClosing}
        onClick={handleClose}
      />
      
      {/* Drawer */}
      <div className={styles.drawer} data-closing={isClosing}>
        {/* Header */}
        <div className={styles.header}>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Laya Studio</span>
              <span className={styles.brandSubtitle}>Admin Portal</span>
            </div>
          </div>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {isDark ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Menu Area */}
        <nav className={styles.menuArea}>
          <div className={styles.menuSection}>
            <Link to={ROUTES.DASHBOARD} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.DASHBOARD ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link to={ROUTES.ALBUMS} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.ALBUMS ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Albums</span>
            </Link>
            <Link to={ROUTES.PROJECTS} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.PROJECTS ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Projects</span>
              {projectCount > 0 && <span className={styles.badge}>{projectCount}</span>}
            </Link>
            <Link to={ROUTES.PROPOSALS} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.PROPOSALS ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Proposals</span>
              {proposalCount > 0 && <span className={styles.badge}>{proposalCount}</span>}
            </Link>
            <Link to={ROUTES.FINANCES} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.FINANCES ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Finances</span>
            </Link>
            <Link to={ROUTES.CALENDAR} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.CALENDAR ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Calendar</span>
            </Link>
            <Link to={ROUTES.ORGANIZATION} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.ORGANIZATION ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>My Organization</span>
            </Link>
          </div>

          <div className={styles.divider}></div>

          {/* Collapsible Sections */}
          <div className={styles.menuSection}>
            {/* Workflow Setup Section */}
            <div className={styles.collapsibleSection}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'workflow' ? null : 'workflow')}
                className={styles.collapsibleHeader}
              >
                <div className={styles.collapsibleHeaderContent}>
                  <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Workflow Setup</span>
                </div>
                <svg className={`${styles.chevron} ${expandedSection === 'workflow' ? styles.chevronExpanded : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`${styles.subMenu} ${expandedSection === 'workflow' ? styles.subMenuExpanded : ''}`}>
                <Link to={ROUTES.EVENTS_SETUP} onClick={handleClose} className={`${styles.subMenuItem} ${location.pathname === ROUTES.EVENTS_SETUP ? styles.active : ''}`}>
                  <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Events Setup</span>
                </Link>
                <Link to={ROUTES.GALLERY_SETUP} onClick={handleClose} className={`${styles.subMenuItem} ${location.pathname === ROUTES.GALLERY_SETUP ? styles.active : ''}`}>
                  <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Gallery Setup</span>
                </Link>
                <Link to={ROUTES.PROJECTS_SETUP} onClick={handleClose} className={`${styles.subMenuItem} ${location.pathname === ROUTES.PROJECTS_SETUP ? styles.active : ''}`}>
                  <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Projects Setup</span>
                </Link>
              </div>
            </div>

            {/* Team & Resources Section */}
            <div className={styles.collapsibleSection}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'team' ? null : 'team')}
                className={styles.collapsibleHeader}
              >
                <div className={styles.collapsibleHeaderContent}>
                  <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Team & Resources</span>
                </div>
                <svg className={`${styles.chevron} ${expandedSection === 'team' ? styles.chevronExpanded : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`${styles.subMenu} ${expandedSection === 'team' ? styles.subMenuExpanded : ''}`}>
                <Link to={ROUTES.TEAM_MEMBERS} onClick={handleClose} className={`${styles.subMenuItem} ${location.pathname === ROUTES.TEAM_MEMBERS ? styles.active : ''}`}>
                  <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Team Members</span>
                </Link>
                <Link to={ROUTES.EQUIPMENTS} onClick={handleClose} className={`${styles.subMenuItem} ${location.pathname === ROUTES.EQUIPMENTS ? styles.active : ''}`}>
                  <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Equipments</span>
                </Link>
                <Link to={ROUTES.ACCESS_MANAGEMENT} onClick={handleClose} className={`${styles.subMenuItem} ${location.pathname === ROUTES.ACCESS_MANAGEMENT ? styles.active : ''}`}>
                  <svg className={styles.subIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Access Management</span>
                </Link>
              </div>
            </div>

            {/* Settings - Non-collapsible */}
            <Link to={ROUTES.SETTINGS} onClick={handleClose} className={`${styles.menuLink} ${location.pathname === ROUTES.SETTINGS ? styles.active : ''}`}>
              <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
};
