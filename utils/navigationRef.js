import { createNavigationContainerRef } from '@react-navigation/native';

// SINGLE shared navigation ref for the whole app.
// - navigation/AppNavigator.js  -> <NavigationContainer ref={navigationRef}>
// - components/Pushnotificationbootstrap.js -> navigate from notification taps
// Bootstrap NavigationContainer ke bahar render hota hai, isliye useNavigation()
// use nahi kar sakte — yehi ref use karna hai.
export const navigationRef = createNavigationContainerRef();