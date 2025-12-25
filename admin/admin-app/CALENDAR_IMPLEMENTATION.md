# Calendar Page Implementation

## Overview
Comprehensive calendar system with 4 view modes (Month, Week, Day, List) for managing photography/videography events and bookings.

## Features Implemented

### 1. Multiple View Modes
- **Month View**: Traditional calendar grid with events displayed in cells
- **Week View**: Timeline-based view with hourly slots (24 hours)
- **Day View**: Single day timeline with detailed event display
- **List View**: Filterable list with advanced search options

### 2. Calendar Controls
- View mode switcher (List/Month/Week/Day)
- Navigation arrows (Previous/Next)
- "Today" button to jump to current date
- Month/date selector for quick navigation
- "New Event" button

### 3. Event Management
- Full CRUD operations (Create, Read, Update, Delete)
- Event modal with comprehensive fields:
  - Project selection
  - Event type
  - Date and time range (from/to)
  - Venue and city
  - Team members assignment (multi-select with avatars)
  - Delivery status
  - Notes
- Event color coding:
  - **Green**: Past events
  - **Blue**: Today's events
  - **Purple**: Future events

### 4. Filtering & Search (List View)
- Text search across event details
- Event type filter
- Date range filter (from/to)
- Status filter
- Team member filter (currently placeholder for future)

### 5. Visual Features
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Color-coded event types
- Avatar display for assigned team members
- Today indicator in month/week views
- Event count badges in month view
- Scrollable event lists in crowded days

## Files Created

### Core Components
1. **Calendar/index.tsx** - Main calendar page with state management
2. **Calendar/Calendar.module.css** - Comprehensive styling for all views

### View Components
3. **components/CalendarHeader.tsx** - Header with controls and navigation
4. **components/MonthView.tsx** - Month grid view
5. **components/WeekView.tsx** - Week timeline view
6. **components/DayView.tsx** - Single day timeline view
7. **components/ListView.tsx** - Filterable list view
8. **components/EventModal.tsx** - Event creation/editing modal

### Utilities
9. **utils/calendar.ts** - Date/time utilities and helper functions
10. **services/api.ts** - Added clientEventApi methods

## API Integration

### New API Methods (clientEventApi)
```typescript
- getAll() - Fetch all events for tenant
- getById(clientEventId) - Get single event
- getByProject(projectId) - Get events by project
- create(data) - Create new event
- update(clientEventId, data) - Update event
- delete(clientEventId) - Delete event
```

### Data Sources
- **ClientEvent** - Main event data (dates, venue, team, notes)
- **Event** - Event type master data (Wedding, Pre-Wedding, etc.)
- **Team** - Team member assignments with avatars
- **Project** - Project associations
- **EventDeliveryStatus** - Event progress tracking

## Key Functions

### Date/Time Utilities
- `formatDateString()` - YYYY-MM-DD formatting
- `formatTime12Hour()` - 12-hour time display
- `getWeekStart/End()` - Week boundary calculations
- `addDays/Months()` - Date navigation
- `isToday()` - Current date checking
- `getEventColor()` - Color coding based on date

### Calendar Logic
- Event grouping by date
- Timeline position calculation (hourly slots)
- Multi-view synchronization
- Responsive grid layouts

## Usage

### Navigation
1. Switch views using top buttons (List/Month/Week/Day)
2. Navigate using arrows or "Today" button
3. Click dates in month view to switch to day view
4. Use month selector for quick jumps

### Creating Events
1. Click "New Event" button
2. Fill in event details (project, type, dates, venue)
3. Assign team members
4. Add notes if needed
5. Save

### Editing Events
1. Click any event in any view
2. Modal opens with pre-filled data
3. Modify fields as needed
4. Save or Delete

### Filtering (List View)
1. Use search box for text search
2. Select event type dropdown
3. Set date range (from/to)
4. Choose status filter
5. Results update automatically

## Responsive Design
- Mobile: Stack controls vertically, 2-row layout
- Tablet: Optimized grid spacing
- Desktop: Full feature set with optimal spacing

## Color Scheme
- Primary: #6366f1 (Indigo)
- Success: #10b981 (Green)
- Warning: #f97316 (Orange)
- Error: #ef4444 (Red)
- Info: #3b82f6 (Blue)

## Future Enhancements (Optional)
- Drag-and-drop event rescheduling
- Recurring events support
- Event templates
- Export to ICS/Google Calendar
- Team member availability view
- Conflict detection
- Equipment assignment integration
- Client portal sharing
