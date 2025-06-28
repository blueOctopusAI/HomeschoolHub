# Calendar Picker Test

## Implementation Summary

I've successfully implemented a calendar picker dropdown for the week navigation in the Homeschool Hub application. Here's what was added:

### Features:
1. **Calendar Popover**: Clicking the date range button now opens a calendar picker
2. **Week Highlighting**: The current week is highlighted with a light green background
3. **Weekend Disabled**: Saturdays and Sundays are disabled (grayed out) since they're not part of the school week
4. **Week Navigation**: Clicking any weekday will navigate to that week
5. **Visual Feedback**: Added a calendar icon to the button to indicate it's clickable
6. **Responsive**: Works on both mobile and desktop views

### Technical Details:
- Used `Popover` component from shadcn/ui
- Used `Calendar` component from shadcn/ui with react-day-picker
- Added week highlighting using `modifiers` and `modifiersClassNames`
- Disabled weekends using the `disabled` prop
- Added helpful footer text to guide users

### Files Modified:
1. `/components/topbar.tsx` - Added the calendar picker functionality
2. `/lib/store.ts` - Added missing types and actions

### How it works:
1. User clicks on the date range button (e.g., "Jun 23 - Jun 27, 2025")
2. A calendar popover appears showing the current month
3. The current week is highlighted in green
4. User can click any weekday to jump to that week
5. The calendar automatically closes and the app navigates to the selected week

The implementation follows the app's design system with the green color scheme (#5e8b7e and #e9f1e7) and maintains consistency with the existing UI components.
