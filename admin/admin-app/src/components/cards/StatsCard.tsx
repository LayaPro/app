import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
}) => {
  return (
    <div className="relative bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl p-[1px]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-[slideInUp_0.3s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white">
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center text-sm font-medium ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-gray-900 dark:text-gray-100 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};
