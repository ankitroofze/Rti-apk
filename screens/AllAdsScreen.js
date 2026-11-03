import React from 'react';
import AllFeedPage from '../components/AllFeedPage';

// Home ke "View More" (Sponsored) par khulne wala alag page — sirf ads
export default function AllAdsScreen({ navigation }) {
  return <AllFeedPage navigation={navigation} kind="ads" />;
}