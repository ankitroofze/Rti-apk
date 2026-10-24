// pages/ChatConversationScreen.js
// UI-only screen. MOCK data used for layout/demo. Wire up to real chat API + socket later.

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import styles, { C } from '../styles/ChatStyles';

// ── MOCK conversation (remove once API is connected) ──
const MOCK_MESSAGES = [
  { id: 'm1', from: 'them', sender: 'Suresh', type: 'text', text: 'Hello! What is the status of the RTI form?', time: '9:40 AM', status: 'read' },
  { id: 'm2', from: 'me', type: 'text', text: 'Hello, the form has been submitted. I am sending the reference number.', time: '9:41 AM', status: 'read', edited: false },
  { id: 'm3', from: 'me', type: 'document', fileName: 'RTI_Application_Copy.pdf', fileMeta: '248 KB · PDF', time: '9:41 AM', status: 'delivered' },
  { id: 'm4', from: 'them', sender: 'Suresh', type: 'image', time: '9:50 AM', status: 'read' },
  { id: 'm5', from: 'them', sender: 'Suresh', type: 'text', text: 'Please confirm the government office address', time: '9:51 AM', status: 'read' },
  { id: 'm6', from: 'me', type: 'location', label: 'Taluka Office, Shirur', time: '9:53 AM', status: 'sent' },
  { id: 'm7', from: 'me', type: 'voice', duration: '0:18', time: '9:54 AM', status: 'delivered' },
  { id: 'm8', from: 'them', sender: 'Suresh', type: 'text', text: 'Okay, sounds good, let us meet there', time: '9:55 AM', status: 'read' },
];

const ATTACH_OPTIONS = [
  { key: 'gallery', label: 'Gallery', icon: 'image', color: '#8B5CF6', bg: '#F3E8FF' },
  { key: 'camera', label: 'Camera', icon: 'camera', color: '#EF4444', bg: '#FEE2E2' },
  { key: 'video', label: 'Video', icon: 'video', color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'document', label: 'Document', icon: 'file-text', color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'location', label: 'Location', icon: 'map-pin', color: '#22C55E', bg: '#DCFCE7' },
  { key: 'contact', label: 'Contact', icon: 'user', color: '#F97316', bg: '#FFF7ED' },
];

function StatusTicks({ status }) {
  // sent -> single grey tick, delivered -> double grey tick, read -> double orange tick
  if (status === 'sent') return <Feather name="check" size={13} color={C.textMuted} />;
  if (status === 'delivered') return <Feather name="check-circle" size={13} color={C.textMuted} />;
  if (status === 'read') return <Feather name="check-circle" size={13} color={C.orange} />;
  return null;
}

function MessageBubble({ msg, isGroup, onLongPress }) {
  const mine = msg.from === 'me';

  const content = () => {
    if (msg.deleted) {
      return <Text style={styles.bubbleDeletedText}>🚫 This message was deleted</Text>;
    }
    switch (msg.type) {
      case 'image':
        return <View style={styles.imageBubble} />; // placeholder image box
      case 'document':
        return (
          <View style={styles.docBubble}>
            <View style={styles.docIconWrap}>
              <Feather name="file-text" size={18} color={C.orange} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.docName} numberOfLines={1}>{msg.fileName}</Text>
              <Text style={styles.docMeta}>{msg.fileMeta}</Text>
            </View>
          </View>
        );
      case 'voice':
        return (
          <View style={styles.voiceBubble}>
            <View style={styles.voicePlayBtn}>
              <Feather name="play" size={13} color={C.white} />
            </View>
            <View style={styles.voiceWaveTrack} />
            <Text style={styles.voiceDuration}>{msg.duration}</Text>
          </View>
        );
      case 'location':
        return (
          <View style={styles.locationBubble}>
            <View style={styles.locationMapPreview}>
              <Feather name="map" size={22} color="#94A3B8" />
            </View>
            <View style={styles.locationLabelRow}>
              <Feather name="map-pin" size={12} color={C.orange} />
              <Text style={styles.locationLabelText} numberOfLines={1}>{msg.label}</Text>
            </View>
          </View>
        );
      default:
        return <Text style={styles.bubbleText}>{msg.text}</Text>;
    }
  };

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={{ maxWidth: '82%' }}>
        {!mine && isGroup ? <Text style={styles.bubbleSenderName}>{msg.sender}</Text> : null}
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => mine && !msg.deleted && onLongPress(msg)}
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}
        >
          {content()}
          {msg.edited ? <Text style={styles.bubbleEditedTag}>edited</Text> : null}
          <View style={styles.bubbleMetaRow}>
            <Text style={styles.bubbleTime}>{msg.time}</Text>
            {mine ? <StatusTicks status={msg.status} /> : null}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChatConversationScreen({ navigation, route }) {
  const params = route?.params || {};
  const chatName = params.name || 'Suresh Jadhav';
  const isGroup = params.type === 'group';

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [msgActionsFor, setMsgActionsFor] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isTheirsTyping] = useState(true); // mock: show typing indicator

  const grouped = useMemo(() => {
    // Simple mock day separator — real implementation groups by actual date
    return [{ label: 'Today', items: messages }];
  }, [messages]);

  const sendMessage = () => {
    if (!draft.trim()) return;
    if (editingId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, text: draft.trim(), edited: true } : m))
      );
      setEditingId(null);
    } else {
      const newMsg = {
        id: `m${Date.now()}`,
        from: 'me',
        type: 'text',
        text: draft.trim(),
        time: 'Now',
        status: 'sent',
      };
      setMessages((prev) => [...prev, newMsg]);
    }
    setDraft('');
  };

  const handleDelete = (msg) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, deleted: true, text: '', type: 'text' } : m))
    );
    setMsgActionsFor(null);
  };

  const handleEdit = (msg) => {
    setDraft(msg.text || '');
    setEditingId(msg.id);
    setMsgActionsFor(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{chatName.charAt(0).toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(isGroup ? 'GroupInfo' : 'ContactInfo', params)}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>{chatName}</Text>
              {isGroup ? (
                <Text style={styles.headerSubtitle}>128 members</Text>
              ) : (
                <View style={styles.presenceRow}>
                  <View style={styles.presenceDot} />
                  <Text style={styles.headerSubtitle}>Online</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerRightBtn} activeOpacity={0.75}>
                <Feather name="phone" size={19} color={C.textDark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerRightBtn}
                activeOpacity={0.75}
                onPress={() => setMenuOpen(true)}
              >
                <Feather name="more-vertical" size={20} color={C.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView contentContainerStyle={styles.messagesContent}>
            {grouped.map((section) => (
              <View key={section.label}>
                <View style={styles.dateChipRow}>
                  <View style={styles.dateChip}>
                    <Text style={styles.dateChipText}>{section.label}</Text>
                  </View>
                </View>
                {section.items.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isGroup={isGroup}
                    onLongPress={setMsgActionsFor}
                  />
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Typing indicator */}
          {isTheirsTyping ? (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.typingText}>{isGroup ? 'Someone is typing…' : `${chatName.split(' ')[0]} is typing…`}</Text>
            </View>
          ) : null}

          {editingId ? (
            <View style={[styles.settingRow, { paddingVertical: 8 }]}>
              <Text style={styles.settingSubLabel}>Editing message</Text>
              <TouchableOpacity onPress={() => { setEditingId(null); setDraft(''); }}>
                <Feather name="x" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.attachBtn}
              activeOpacity={0.75}
              onPress={() => setAttachOpen(true)}
            >
              <Feather name="paperclip" size={21} color={C.textMid} />
            </TouchableOpacity>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message"
                placeholderTextColor={C.textMuted}
                value={draft}
                onChangeText={setDraft}
                multiline
              />
              <TouchableOpacity activeOpacity={0.75}>
                <Feather name="smile" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            {draft.trim() ? (
              <TouchableOpacity style={styles.sendBtn} activeOpacity={0.85} onPress={sendMessage}>
                <Feather name="send" size={18} color={C.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn} activeOpacity={0.85}>
                <Feather name="mic" size={19} color={C.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment sheet */}
      <Modal visible={attachOpen} transparent animationType="fade" onRequestClose={() => setAttachOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setAttachOpen(false)}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Share content</Text>
            <View style={styles.sheetGrid}>
              {ATTACH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.sheetItem}
                  activeOpacity={0.8}
                  onPress={() => setAttachOpen(false)}
                >
                  <View style={[styles.sheetIconWrap, { backgroundColor: opt.bg }]}>
                    <Feather name={opt.icon} size={22} color={opt.color} />
                  </View>
                  <Text style={styles.sheetItemLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Message long-press actions: edit / delete */}
      <Modal visible={!!msgActionsFor} transparent animationType="fade" onRequestClose={() => setMsgActionsFor(null)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setMsgActionsFor(null)}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            {msgActionsFor?.type === 'text' ? (
              <TouchableOpacity style={styles.actionSheetRow} onPress={() => handleEdit(msgActionsFor)}>
                <Feather name="edit-2" size={17} color={C.textDark} />
                <Text style={styles.actionSheetRowText}>Edit message</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.actionSheetRow}>
              <Feather name="copy" size={17} color={C.textDark} />
              <Text style={styles.actionSheetRowText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetRow, { borderBottomWidth: 0 }]}
              onPress={() => handleDelete(msgActionsFor)}
            >
              <Feather name="trash-2" size={17} color={C.red} />
              <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Delete message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header menu: view info / mute / block / report */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              style={styles.actionSheetRow}
              onPress={() => { setMenuOpen(false); navigation.navigate(isGroup ? 'GroupInfo' : 'ContactInfo', params); }}
            >
              <Feather name="info" size={17} color={C.textDark} />
              <Text style={styles.actionSheetRowText}>{isGroup ? 'Group info' : 'View contact'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetRow}>
              <Feather name="bell-off" size={17} color={C.textDark} />
              <Text style={styles.actionSheetRowText}>Mute notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetRow}>
              <MaterialCommunityIcons name="broom" size={17} color={C.textDark} />
              <Text style={styles.actionSheetRowText}>Clear chat</Text>
            </TouchableOpacity>
            {!isGroup ? (
              <TouchableOpacity style={styles.actionSheetRow} onPress={() => setMenuOpen(false)}>
                <Feather name="slash" size={17} color={C.red} />
                <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Block {chatName.split(' ')[0]}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionSheetRow} onPress={() => setMenuOpen(false)}>
                <Feather name="log-out" size={17} color={C.red} />
                <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Leave group</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionSheetRow, { borderBottomWidth: 0 }]} onPress={() => setMenuOpen(false)}>
              <Feather name="flag" size={17} color={C.red} />
              <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Report {isGroup ? 'group' : 'user'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
