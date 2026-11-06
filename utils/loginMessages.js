// utils/loginMessages.js
// Bina login ke like / comment / follow / save par jo toast message dikhana hai.
const LOGIN_MESSAGES = {
  like: 'Please login to like this post.',
  comment: 'Please login to comment.',
  follow: 'Please login to follow this user.',
  save: 'Please login to save this post.',
  block: 'Please login to block this user.',
  report: 'Please login to submit a report.',
  continue: 'Please login to continue.',
};

export const loginMessage = (action = 'continue') => LOGIN_MESSAGES[action] || LOGIN_MESSAGES.continue;