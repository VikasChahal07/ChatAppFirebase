import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type User = {
  id: string;
  name?: string;
  email: string;
};

type RootStackParamList = {
  Users: undefined;
  Chat: { user: User; roomId: string };
  Login: undefined; 
};

type UsersListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Users'>;
  route: RouteProp<RootStackParamList, 'Users'>;
};

export default function UsersListScreen({ navigation }: UsersListScreenProps) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(snapshot => {
        const allUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];

        const currentUserId = auth().currentUser?.uid;
        const filteredUsers = allUsers.filter(u => u.id !== currentUserId);
        setUsers(filteredUsers);
      });

    return () => unsubscribe();
  }, []);

  const startChat = (user: User) => {
    const myId = auth().currentUser?.uid;
    if (!myId) return;

    const roomId = myId < user.id ? `${myId}_${user.id}` : `${user.id}_${myId}`;
    navigation.navigate('Chat', { user, roomId });
  };

  const logout = async () => {
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], 
      });
    } catch (error) {
      Alert.alert('Logout Failed', 'Something went wrong during logout.');
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => startChat(item)}>
      <Text style={styles.userName}>{item.name || item.email}</Text>
      {item.name && <Text style={styles.userEmail}>{item.email}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="Logout" onPress={logout} color="#f44336" /> 
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No other users found.</Text>}
        contentContainerStyle={{ paddingTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  userItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  userName: { fontSize: 16, fontWeight: 'bold' },
  userEmail: { fontSize: 14, color: 'gray', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' },
});
