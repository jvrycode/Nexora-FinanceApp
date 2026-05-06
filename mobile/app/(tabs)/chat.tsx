/**
 * AI Chat Screen — Gemini-powered financial assistant
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { sendChatMessage } from '@/services/groq';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])).start();
    });
  }, []);
  return (
    <View style={s.bubbleRow}>
      <View style={s.aiBubble}>
        <View style={{ flexDirection: 'row', gap: 4, padding: 4 }}>
          {dots.map((d, i) => <Animated.View key={i} style={[s.typingDot, { opacity: d }]} />)}
        </View>
      </View>
    </View>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[s.bubbleRow, isUser && s.bubbleRowUser]}>
      <View style={[s.bubble, isUser ? s.userBubble : s.aiBubble]}>
        <Text style={[s.bubbleText, isUser && { color: Colors.black }]}>{message.content}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { summary } = usePortfolioStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const listRef = useRef<FlatList>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase.from('chat_messages').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: true }).limit(50);
        if (data?.length) {
          // Clear old messages from Supabase that may have emoji errors
          const hasOldErrors = data.some((m: any) => m.content?.includes('getting a lot of questions'));
          if (hasOldErrors) {
            await supabase.from('chat_messages').delete().eq('user_id', user.id);
            setMessages([{ id: 'welcome', role: 'assistant', content: "Hello. I'm Nexora AI, your personal finance assistant. Ask me anything about your portfolio, market trends, or financial tips.", timestamp: new Date() }]);
          } else {
            setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.created_at) })));
          }
        } else {
          setMessages([{ id: 'welcome', role: 'assistant', content: "Hello. I'm Nexora AI, your personal finance assistant. Ask me anything about your portfolio, market trends, or financial tips.", timestamp: new Date() }]);
        }
      } catch {
        setMessages([{ id: 'welcome', role: 'assistant', content: "Hello. I'm Nexora AI. How can I help you today?", timestamp: new Date() }]);
      }
      setReady(true);
    })();
  }, [user?.id]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsTyping(true);
    if (user?.id) { supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: userMsg.content }).then(() => { }); }
    try {
      const history = messages.filter(m => m.id !== 'welcome').slice(-10).map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.content }));
      history.push({ role: 'user', content: userMsg.content });
      const response = await sendChatMessage(history, summary || undefined);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
      setMessages(p => [...p, aiMsg]);
      if (user?.id) { supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: response }).then(() => { }); }
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I couldn't process that. Please try again!", timestamp: new Date() }]);
    }
    setIsTyping(false);
  }, [input, isTyping, messages, summary, user?.id]);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100); }, [messages.length, isTyping]);

  const suggestions = ["What's my net worth?", "Which crypto is trending?", "Give me saving tips", "How's the market today?"];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        {!ready ? <View style={s.loader}><ActivityIndicator size="large" color={Colors.accent} /></View> : (
          <>
            <FlatList ref={listRef} data={messages} keyExtractor={i => i.id} renderItem={({ item }) => <ChatBubble message={item} />}
              contentContainerStyle={s.msgList} showsVerticalScrollIndicator={false}
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
              ListHeaderComponent={messages.length <= 1 ? (
                <View style={s.sugBox}><Text style={s.sugTitle}>Try asking:</Text>
                  {suggestions.map((t, i) => <TouchableOpacity key={i} style={s.sugPill} onPress={() => setInput(t)}><Text style={s.sugText}>{t}</Text></TouchableOpacity>)}
                </View>
              ) : null}
            />
            <View style={[s.inputBar, { paddingBottom: keyboardVisible ? Spacing.md : (Platform.OS === 'ios' ? 90 : 70) }]}>
              <TextInput style={s.input} value={input} onChangeText={setInput} placeholder="Ask Nexora AI..." placeholderTextColor={Colors.textTertiary} multiline maxLength={500} />
              <TouchableOpacity style={[s.sendBtn, (!input.trim() || isTyping) && s.sendOff]} onPress={handleSend} disabled={!input.trim() || isTyping}>
                <Ionicons name="arrow-up" size={20} color={!input.trim() || isTyping ? Colors.textTertiary : Colors.black} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md, maxWidth: '85%' },
  bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, marginBottom: 2 },
  bubble: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, maxWidth: '100%' },
  userBubble: { backgroundColor: Colors.accent, borderBottomRightRadius: 6 },
  aiBubble: { backgroundColor: Colors.surfaceElevated, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: Colors.border + '60' },
  bubbleText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textSecondary },
  sugBox: { paddingVertical: Spacing.xl, gap: Spacing.sm },
  sugTitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  sugPill: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated },
  sugText: { fontSize: FontSize.md, color: Colors.text },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border + '40', backgroundColor: Colors.background, gap: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendOff: { backgroundColor: Colors.surfaceElevated },
});
