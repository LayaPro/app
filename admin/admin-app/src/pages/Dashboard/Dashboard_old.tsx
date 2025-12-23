import React from 'react';
import { StatsCard } from '../../components/cards/StatsCard.js';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Projects"
          value="42"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          trend={{ value: '+12%', isPositive: true }}
          subtitle="From last month"
        />
        
        <StatsCard
          title="Active Events"
          value="18"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          trend={{ value: '+5', isPositive: true }}
          subtitle="This week"
        />
        
        <StatsCard
          title="Total Revenue"
          value="₹12.5L"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: '+18%', isPositive: true }}
          subtitle="This quarter"
        />
        
        <StatsCard
          title="Team Members"
          value="24"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          trend={{ value: '+2', isPositive: true }}
          subtitle="Active members"
        />
      </div>

      {/* Recent Activity */}
      <div className="relative bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl p-[1px]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              <div className="w-2 h-2 bg-[#6366f1] rounded-full"></div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-gray-100 font-medium">New project created</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Sharma-Verma Wedding</p>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">2 hours ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              <div className="w-2 h-2 bg-[#8b5cf6] rounded-full"></div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-gray-100 font-medium">Payment received</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">₹50,000 from Kumar Wedding</p>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">5 hours ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-gray-100 font-medium">Event completed</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Mehndi Ceremony - Patel Wedding</p>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
