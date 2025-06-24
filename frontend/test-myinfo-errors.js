// Test script for MyInfo error handling
// Copy and paste these commands in browser console while on the form page

// Test 1: Simulate MyInfo unavailable
function testMyInfoUnavailable() {
  const event = new CustomEvent('myinfo-error', {
    detail: { message: 'MyInfo service is temporarily unavailable. Please try again later.' }
  });
  window.dispatchEvent(event);
}

// Test 2: Simulate MyInfo timeout
function testMyInfoTimeout() {
  const event = new CustomEvent('myinfo-error', {
    detail: { message: 'MyInfo authentication timed out. Please try again.' }
  });
  window.dispatchEvent(event);
}

// Test 3: Simulate maintenance
function testMyInfoMaintenance() {
  const event = new CustomEvent('myinfo-error', {
    detail: { message: 'MyInfo is currently undergoing maintenance. Service will be restored shortly.' }
  });
  window.dispatchEvent(event);
}

// Test 4: Direct method call (if FormPage is accessible)
function testDirectCall() {
  // Find the FormPage component instance
  const formPageElement = document.querySelector('[data-component="FormPage"]');
  if (formPageElement && formPageElement._reactInternalInstance) {
    const formPageInstance = formPageElement._reactInternalInstance.return.stateNode;
    if (formPageInstance && formPageInstance.simulateMyInfoError) {
      formPageInstance.simulateMyInfoError();
    }
  }
}

console.log('MyInfo Error Testing Functions Loaded:');
console.log('- testMyInfoUnavailable()');
console.log('- testMyInfoTimeout()');
console.log('- testMyInfoMaintenance()');
console.log('- testDirectCall()');
