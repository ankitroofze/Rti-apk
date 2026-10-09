// pages/ChatListScreen.js
// UI-only screen. Data below is MOCK data for layout/demo purposes.
// TODO (next phase): replace MOCK_CHATS with API data (chat list endpoint) + socket for live updates.

import NameWithTick from '../components/NameWithTick';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles, { C } from '../styles/ChatStyles';

// ── MOCK DATA (remove once API is connected) ──
const MOCK_CHATS = [
  {
    id: 'c1',
    type: 'single',
    name: 'Ramesh Patil',
    lastMessage: 'Aapka RTI application draft ready hai, check karo.',
    time: '10:42 AM',
    unread: 2,
    online: true,
    muted: false,
  },
  {
    id: 'g1',
    type: 'group',
    name: 'Taluka RTI Volunteers',
    lastMessage: 'Suresh: Meeting kal 5 baje rakhte hain',
    time: '9:58 AM',
    unread: 5,
    members: 128,
    muted: false,
  },
  {
    id: 'c2',
    type: 'single',
    name: 'Anita Deshmukh',
    lastMessage: 'Photo',
    time: 'Yesterday',
    unread: 0,
    online: false,
    muted: false,
  },
  {
    id: 'g2',
    type: 'group',
    name: 'District Admin Panel',
    lastMessage: 'You: Location shared',
    time: 'Yesterday',
    unread: 0,
    members: 34,
    muted: true,
  },
  {
    id: 'c3',
    type: 'single',
    name: 'Sunil Kadam',
    lastMessage: 'Voice message',
    time: 'Mon',
    unread: 0,
    online: true,
    muted: false,
  },
];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'single', label: 'Personal' },
  { key: 'group', label: 'Groups' },
];

function Avatar({ item }) {
  const initial = (item.name || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
      {item.type === 'single' && item.online ? <View style={styles.onlineDot} /> : null}
      {item.type === 'group' ? (
        <View style={styles.groupBadge}>
          <Feather name="users" size={10} color={C.white} />
        </View>
      ) : null}
    </View>
  );
}

function ChatRow({ item, onPress }) {
  const hasUnread = item.unread > 0;
  return (
    <TouchableOpacity style={styles.chatRow} activeOpacity={0.7} onPress={onPress}>
      <Avatar item={item} />
      <View style={styles.chatRowMain}>
        <View style={styles.chatRowTop}>
          <NameWithTick name={item.name} user={item} style={styles.chatName} />
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatRowBottom}>
          <Text
            style={[styles.chatLastMsg, hasUnread && styles.chatLastMsgUnread]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.muted ? (
            <Feather name="bell-off" size={13} color={C.textMuted} style={styles.muteIcon} />
          ) : null}
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = MOCK_CHATS;
    if (activeTab !== 'all') list = list.filter((c) => c.type === activeTab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, query]);

  const openChat = (item) => {
    // TODO: pass real chat/thread id once API is connected
    navigation.navigate('ChatConversation', { chatId: item.id, name: item.name, type: item.type });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={20} color={C.textDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Chats</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerRightBtn} activeOpacity={0.75}>
              <Feather name="camera" size={20} color={C.textDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerRightBtn}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Feather name="edit" size={19} color={C.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats & groups"
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length ? (
            filtered.map((item) => (
              <ChatRow key={item.id} item={item} onPress={() => openChat(item)} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={32} color={C.textMuted} />
              <Text style={styles.emptyStateText}>No chats found</Text>
            </View>
          )}
        </ScrollView>

        {/* Floating action: new chat / new group */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Feather name="plus" size={24} color={C.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}