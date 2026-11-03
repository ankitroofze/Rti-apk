import React from 'react';
import AllFeedPage from '../components/AllFeedPage';

// Home ke Trending "See All" par khulne wala alag page — sirf news
export default function AllNewsScreen({ navigation }) {
  return <AllFeedPage navigation={navigation} kind="news" />;
}