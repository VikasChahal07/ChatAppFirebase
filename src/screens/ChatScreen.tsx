import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

interface Message {
  text: string;
  createdAt: string;
  senderId: string;
}

type ChatScreenRouteProp = RouteProp<
  { Chat: { user: any; roomId: string } },
  'Chat'
>;

interface Props {
  route: ChatScreenRouteProp;
}

type RootStackParamList = {
  Users: undefined;
  Chat: { user: any; roomId: string };
  Login: undefined;
};

type ChatScreenProps = StackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { user, roomId } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    loadLocalMessages();

    const unsubscribe = firestore()
      .collection('chatrooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        const newMessages: Message[] = snapshot.docs.map(doc => doc.data() as Message);
        setMessages(newMessages);
        saveLocalMessages(newMessages);
      });

    return () => unsubscribe();
  }, []);

  const loadLocalMessages = async () => {
    try {
      const saved = await AsyncStorage.getItem(roomId);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading local messages:', error);
    }
  };

  const saveLocalMessages = async (msgs: Message[]) => {
    try {
      await AsyncStorage.setItem(roomId, JSON.stringify(msgs));
    } catch (error) {
      console.error('Error saving local messages:', error);
    }
  };

  const sendMessage = async () => {
    if (message.trim().length === 0) return;

    const newMessage: Message = {
      text: message,
      createdAt: new Date().toISOString(),
      senderId: auth().currentUser?.uid ?? '',
    };

    await firestore()
      .collection('chatrooms')
      .doc(roomId)
      .collection('messages')
      .add(newMessage);

    setMessage('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={item.senderId === auth().currentUser?.uid ? styles.myMessage : styles.theirMessage}>
            {item.text}
          </Text>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
          style={styles.input}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, padding: 10, marginRight: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#dcf8c6', padding: 10, marginVertical: 5, borderRadius: 5 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#eee', padding: 10, marginVertical: 5, borderRadius: 5 },
});
