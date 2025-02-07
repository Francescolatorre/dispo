# Timeline Components

## TimelineGrid

A flexible grid component for displaying time-based data with various scales (day, week, month).

### Features

- Supports day, week, and month scales
- Handles full year and partial year views
- Shows weekend columns in day view
- Displays month boundaries
- Shows today marker
- Supports custom content via children
- Handles invalid date ranges gracefully

### Props

```typescript
interface TimelineGridProps {
  startDate: Date;      // Start date of the timeline
  endDate: Date;        // End date of the timeline
  scale: 'day' | 'week' | 'month';  // Scale of the timeline
  children?: React.ReactNode;  // Optional content to render within the grid
}
```

### Usage

```tsx
import TimelineGrid from './components/timeline/TimelineGrid';

// Full year view
<TimelineGrid
  startDate={new Date('2024-01-01')}
  endDate={new Date('2024-12-31')}
  scale="day"
/>

// Week view
<TimelineGrid
  startDate={new Date('2024-01-01')}
  endDate={new Date('2024-12-31')}
  scale="week"
/>

// Month view
<TimelineGrid
  startDate={new Date('2024-01-01')}
  endDate={new Date('2024-12-31')}
  scale="month"
/>

// With custom content
<TimelineGrid
  startDate={new Date('2024-01-01')}
  endDate={new Date('2024-12-31')}
  scale="day"
>
  <div style={{ position: 'absolute', left: '100px' }}>
    Custom content
  </div>
</TimelineGrid>
```

### Implementation Details

- Uses CSS Grid for layout
- Sticky headers for better scrolling experience
- Visual indicators for weekends and month boundaries
- Today marker for current date reference
- Responsive design with configurable column widths
- Handles leap years correctly
- Validates date ranges