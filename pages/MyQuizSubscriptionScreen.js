// pages/MyQuizSubscriptionScreen.js
// ─────────────────────────────────────────────────────────
// Unified Quiz Subscription screen:
//   - Upar: Active subscription card (agar active ho)
//   - Niche: "Our Plans" grid with direct checkout
// ─────────────────────────────────────────────────────────
import React from 'react';
import QuizSubscriptionScreen from '../screens/QuizSubscriptionScreen';

export default function MyQuizSubscriptionScreen(props) {
  return <QuizSubscriptionScreen {...props} redirectScreenName="My Quiz Subscription" />;
}
