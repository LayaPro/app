import React from 'react';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { useAppSelector } from '../../store/index.js';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarCollapsed } = useAppSelector((state: any) => state.ui);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Header />
      <main
        className={`
          pt-16 transition-all duration-300
          ${sidebarCollapsed ? 'ml-20' : 'ml-64'}
        `}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
