export interface HelpSection {
  title: string;
  content: string;
  icon?: string;
}

export interface PageHelp {
  pageTitle: string;
  description: string;
  sections: HelpSection[];
  videoUrl?: string;
  relatedLinks?: { title: string; path: string }[];
}

export const helpContent: Record<string, PageHelp> = {
  dashboard: {
    pageTitle: 'Dashboard',
    description: 'Your central hub for key metrics, recent activities, and quick access to important features.',
    sections: [
      {
        title: 'Overview Cards',
        content: 'View quick stats for total projects, active events, team members, and storage usage. These cards provide at-a-glance insights into your business.',
        icon: '📊',
      },
      {
        title: 'Recent Activity',
        content: 'Track recent uploads, project updates, and team actions. Stay informed about what\'s happening across your organization.',
        icon: '🔔',
      },
      {
        title: 'Quick Actions',
        content: 'Access frequently used features quickly. Create new projects, schedule events, or upload photos directly from the dashboard.',
        icon: '⚡',
      },
    ],
  },

  storage: {
    pageTitle: 'Storage Management',
    description: 'Monitor and manage your storage usage across all projects and events.',
    sections: [
      {
        title: 'Understanding Storage Metrics',
        content: 'Your storage overview shows total used space, remaining space, and usage percentage. The color-coded progress bar helps you quickly identify if you\'re approaching your limit (orange) or have exceeded it (red).',
        icon: '📊',
      },
      {
        title: 'Storage Breakdown',
        content: 'View detailed storage usage organized by projects and events. Click on any project to expand and see storage consumed by each event. This helps identify which projects or events are using the most space.',
        icon: '📁',
      },
      {
        title: 'Upgrading Your Plan',
        content: 'When your storage is healthy, you can upgrade to a higher plan by clicking the "Upgrade Plan" button. Choose from available plans based on your storage needs. The upgrade takes effect immediately.',
        icon: '⬆️',
      },
      {
        title: 'Managing Storage Limits',
        content: 'If you\'re near or over your storage limit, you have two options: delete unused images/events to free up space, or upgrade to a plan with more storage. Critical alerts will appear when action is needed.',
        icon: '⚠️',
      },
      {
        title: 'Tips for Efficient Storage Use',
        content: 'Regularly review and delete old or unused events. Archive completed projects. Use image optimization before uploading. Monitor your storage dashboard to stay ahead of limits.',
        icon: '💡',
      },
    ],
    relatedLinks: [
      { title: 'Manage Projects', path: '/projects' },
      { title: 'View Plans', path: '/settings' },
    ],
  },
  
  projects: {
    pageTitle: 'Projects Management',
    description: 'Create, organize, and manage all your photography projects in one place.',
    sections: [
      {
        title: 'Creating Projects',
        content: 'Click "New Project" to create a project. Add client details, project type, dates, and budget. Projects help organize your work and events systematically.',
        icon: '➕',
      },
      {
        title: 'Project Details',
        content: 'Each project contains client information, events, team members, deliverables, and financial tracking. Use project cards to quickly access all project-related activities.',
        icon: '📋',
      },
      {
        title: 'Project Status',
        content: 'Track project progress through different statuses: Planning, In Progress, Review, Completed, or Archived. Update status as your project moves through each phase.',
        icon: '🎯',
      },
      {
        title: 'Managing Events',
        content: 'Within each project, create multiple events representing specific shoots or occasions. Assign dates, upload photos, and track deliverables per event.',
        icon: '📅',
      },
    ],
    relatedLinks: [
      { title: 'Calendar', path: '/calendar' },
      { title: 'Team Members', path: '/team' },
    ],
  },
  
  calendar: {
    pageTitle: 'Calendar & Scheduling',
    description: 'Manage your events, bookings, and schedule across all projects.',
    sections: [
      {
        title: 'Calendar Views',
        content: 'Switch between month, week, and day views to see your schedule at different levels. Color-coded events help distinguish between different project types and statuses.',
        icon: '📅',
      },
      {
        title: 'Creating Events',
        content: 'Click on any date to create a new event. Add event details, link to projects, assign team members, set locations, and configure reminders.',
        icon: '✨',
      },
      {
        title: 'Event Management',
        content: 'Click on existing events to view or edit details. Track event status, manage assigned team, upload photos, and monitor deliverables.',
        icon: '🔍',
      },
      {
        title: 'Drag & Drop',
        content: 'Easily reschedule events by dragging them to new dates. Extend event duration by dragging the edges. Changes are saved automatically.',
        icon: '🖱️',
      },
    ],
    relatedLinks: [
      { title: 'Manage Projects', path: '/projects' },
      { title: 'Team Members', path: '/team' },
    ],
  },
  
  team: {
    pageTitle: 'Team Management',
    description: 'Manage your team members, roles, permissions, and collaboration.',
    sections: [
      {
        title: 'Adding Team Members',
        content: 'Invite team members by email. Assign roles (Admin, Editor, Viewer) to control access levels. Specify whether members are internal staff or external freelancers.',
        icon: '👥',
      },
      {
        title: 'Roles & Permissions',
        content: 'Admins have full access. Editors can manage projects and content. Viewers have read-only access. Configure custom permissions for specific needs.',
        icon: '🔐',
      },
      {
        title: 'Freelancer Management',
        content: 'Mark external collaborators as freelancers. They receive limited access and can be assigned to specific projects only.',
        icon: '🤝',
      },
      {
        title: 'Managing Access',
        content: 'Edit member roles, deactivate accounts, or remove members as needed. Monitor team activity and workload distribution through the dashboard.',
        icon: '⚙️',
      },
    ],
    relatedLinks: [
      { title: 'Access Management', path: '/access-management' },
      { title: 'Audit Trail', path: '/audit-trail' },
    ],
  },

  albums: {
    pageTitle: 'Albums & Gallery',
    description: 'Create and manage photo albums, galleries, and client deliverables.',
    sections: [
      {
        title: 'Creating Albums',
        content: 'Organize event photos into albums for clients. Select photos, arrange order, add descriptions, and customize album appearance.',
        icon: '📸',
      },
      {
        title: 'Gallery Setup',
        content: 'Configure client-facing galleries with custom branding, watermarks, and download settings. Control what clients can see and download.',
        icon: '🖼️',
      },
      {
        title: 'Bulk Operations',
        content: 'Upload multiple photos at once, batch edit metadata, or organize photos across albums efficiently.',
        icon: '📦',
      },
      {
        title: 'Sharing Albums',
        content: 'Generate secure links to share albums with clients. Set expiration dates, password protection, and download limits.',
        icon: '🔗',
      },
    ],
  },

  finances: {
    pageTitle: 'Financial Management',
    description: 'Track payments, invoices, expenses, and financial health of your business.',
    sections: [
      {
        title: 'Invoice Management',
        content: 'Create professional invoices, track payment status, send reminders, and manage client billing efficiently.',
        icon: '💰',
      },
      {
        title: 'Payment Tracking',
        content: 'Monitor received payments, pending dues, and payment history. Get alerts for overdue invoices.',
        icon: '💳',
      },
      {
        title: 'Expense Tracking',
        content: 'Record business expenses, categorize costs, and track profitability per project. Generate expense reports for accounting.',
        icon: '📊',
      },
      {
        title: 'Financial Reports',
        content: 'View revenue summaries, profit margins, outstanding payments, and cash flow. Export reports for tax purposes.',
        icon: '📈',
      },
    ],
  },

  proposals: {
    pageTitle: 'Proposals & Quotes',
    description: 'Create, send, and manage proposals and quotations for potential clients.',
    sections: [
      {
        title: 'Creating Proposals',
        content: 'Build professional proposals with service descriptions, pricing, terms, and deliverables. Use templates to save time.',
        icon: '📄',
      },
      {
        title: 'Proposal Templates',
        content: 'Create reusable templates for different service types. Customize branding, pricing structures, and terms.',
        icon: '📋',
      },
      {
        title: 'Tracking Status',
        content: 'Monitor proposal status: Sent, Viewed, Accepted, Rejected. Get notified when clients view or respond.',
        icon: '👁️',
      },
      {
        title: 'Converting to Projects',
        content: 'When a proposal is accepted, convert it directly into a project with all details pre-filled.',
        icon: '✅',
      },
    ],
  },

  organization: {
    pageTitle: 'Organization Settings',
    description: 'Configure your organization profile, branding, and business information.',
    sections: [
      {
        title: 'Business Information',
        content: 'Update organization name, address, contact details, and registration information. This appears on invoices and client communications.',
        icon: '🏢',
      },
      {
        title: 'Branding',
        content: 'Upload your logo, set brand colors, and customize the appearance of client-facing materials like galleries and proposals.',
        icon: '🎨',
      },
      {
        title: 'Social Media',
        content: 'Add links to your social media profiles. These appear in email signatures and client communications.',
        icon: '🌐',
      },
      {
        title: 'Business Hours',
        content: 'Set your working hours and timezone. This helps with scheduling and client expectations.',
        icon: '⏰',
      },
    ],
  },

  settings: {
    pageTitle: 'Application Settings',
    description: 'Customize your application preferences, notifications, and integrations.',
    sections: [
      {
        title: 'User Preferences',
        content: 'Set your timezone, date format, language, and display preferences. Customize how you interact with the application.',
        icon: '🎨',
      },
      {
        title: 'Notification Settings',
        content: 'Control email and in-app notifications. Choose what events trigger alerts: uploads, payments, project updates, etc.',
        icon: '🔔',
      },
      {
        title: 'Integrations',
        content: 'Connect third-party services like Google Calendar, payment gateways, and cloud storage providers.',
        icon: '🔌',
      },
      {
        title: 'Security',
        content: 'Manage password, enable two-factor authentication, view active sessions, and configure security preferences.',
        icon: '🔒',
      },
    ],
  },

  'access-management': {
    pageTitle: 'Access Management',
    description: 'Control user permissions, roles, and access levels across your organization.',
    sections: [
      {
        title: 'Role Management',
        content: 'Create and manage custom roles with specific permissions. Define what each role can view, edit, or delete.',
        icon: '👤',
      },
      {
        title: 'Permission Groups',
        content: 'Organize permissions into logical groups: Projects, Finances, Team, Settings. Assign groups to roles efficiently.',
        icon: '🔑',
      },
      {
        title: 'User Assignment',
        content: 'Assign roles to team members. Users inherit all permissions from their assigned role.',
        icon: '👥',
      },
    ],
  },

  'audit-trail': {
    pageTitle: 'Audit Trail',
    description: 'Track all user actions and system events for security and compliance.',
    sections: [
      {
        title: 'Activity Logs',
        content: 'View detailed logs of all user actions: logins, file uploads, edits, deletions. Each entry includes timestamp, user, and action details.',
        icon: '📋',
      },
      {
        title: 'Filtering & Search',
        content: 'Filter logs by date range, user, action type, or resource. Search for specific events quickly.',
        icon: '🔍',
      },
      {
        title: 'Export Logs',
        content: 'Export audit logs for compliance, reporting, or analysis. Download in CSV or PDF format.',
        icon: '💾',
      },
    ],
  },

  'events-setup': {
    pageTitle: 'Events Setup',
    description: 'Configure event types, templates, and default settings for your events.',
    sections: [
      {
        title: 'Event Types',
        content: 'Define event categories like Wedding, Corporate, Portrait. Set default duration, pricing, and requirements for each type.',
        icon: '🎭',
      },
      {
        title: 'Event Templates',
        content: 'Create templates with pre-filled checklists, timelines, and deliverables. Speed up event creation.',
        icon: '📝',
      },
      {
        title: 'Default Settings',
        content: 'Configure default event settings: reminder times, booking requirements, cancellation policies.',
        icon: '⚙️',
      },
    ],
  },
};

// Helper function to get help content for a page
export const getHelpContent = (pageKey: string): PageHelp | null => {
  return helpContent[pageKey] || null;
};
