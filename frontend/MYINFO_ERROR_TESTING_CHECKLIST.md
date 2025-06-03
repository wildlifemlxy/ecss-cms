# MyInfo Error Modal Testing Checklist

## Functional Testing

### Error Display
- [ ] Modal appears when MyInfo error occurs
- [ ] Error message is displayed correctly
- [ ] Warning icon (⚠️) is visible
- [ ] Modal title shows "MyInfo Unavailable"

### Modal Interaction
- [ ] Click outside modal to close (should work)
- [ ] Click X button to close modal
- [ ] "Proceed Manually" button works
- [ ] "Try Again Later" button works
- [ ] Modal prevents interaction with background

### Button Functionality
- [ ] "Proceed Manually" moves to Personal Info section (section 1)
- [ ] "Try Again Later" just closes the modal
- [ ] User can continue with manual form entry after proceeding

### Error Scenarios
- [ ] MyInfo service unavailable
- [ ] MyInfo timeout
- [ ] MyInfo maintenance
- [ ] Connection failed
- [ ] High traffic errors
- [ ] Generic authentication errors

## Visual Testing

### Desktop
- [ ] Modal is centered on screen
- [ ] Modal has proper shadows/blur
- [ ] Buttons are properly styled
- [ ] Text is readable
- [ ] Modal doesn't overflow screen

### Mobile/Tablet
- [ ] Modal is responsive
- [ ] Buttons stack vertically on small screens
- [ ] Text scales appropriately
- [ ] Modal fits within viewport

### Animation
- [ ] Modal slides in smoothly
- [ ] No jerky animations
- [ ] Proper fade/blur effects

## Integration Testing

### SingPass Integration
- [ ] SingPass errors trigger MyInfo modal appropriately
- [ ] Other SingPass errors don't trigger MyInfo modal
- [ ] Error callback chain works correctly

### Form Integration
- [ ] Manual form entry works after error
- [ ] SingPass data clearing works
- [ ] Form validation still works
- [ ] No duplicate modals appear

## Browser Testing

### Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility
- [ ] Modal is focusable
- [ ] Tab navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Keyboard shortcuts work (Ctrl+Shift+E in dev)

## Performance Testing

### Memory
- [ ] No memory leaks after multiple modal opens/closes
- [ ] Event listeners are properly cleaned up
- [ ] No console errors

### User Experience
- [ ] Modal appears quickly (< 300ms)
- [ ] Animations are smooth (60fps)
- [ ] No blocking of UI thread

## Testing Methods Used
- [ ] Development button test
- [ ] URL parameter simulation
- [ ] Browser console testing
- [ ] Network throttling
- [ ] Domain blocking
- [ ] Keyboard shortcuts (Ctrl+Shift+E)
- [ ] Manual error injection

## Edge Cases
- [ ] Multiple rapid error triggers
- [ ] Error during form submission
- [ ] Error while other modals are open
- [ ] Error on slow network connections
- [ ] Error with JavaScript disabled (graceful degradation)

## Production Readiness
- [ ] Development-only features hidden in production
- [ ] Error logging works correctly
- [ ] Fallback error messages work
- [ ] No console.log statements in production build
- [ ] Error tracking/analytics integrated (if applicable)
