import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleLogin = async () => {
    if (!email || !password || !name) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log('Logged in:', user.email);
      
      await checkAndSaveUser(user.uid);

      navigation.navigate('UsersList');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        try {
          const userCredential = await auth().createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;

          console.log('Registered:', user.email);

          await firestore().collection('users').doc(user.uid).set({
            name: name,
            email: user.email,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });

          navigation.navigate('UsersList');
        } catch (err: any) {
          console.error('Registration Error:', err.message);
          Alert.alert('Registration Error', err.message);
        }
      } else {
        console.error('Login Error:', error.message);
        Alert.alert('Login Error', error.message);
      }
    }
  };

  const checkAndSaveUser = async (uid: string) => {
    const userDoc = await firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await firestore().collection('users').doc(uid).set({
        name: name,
        email: email,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login / Register</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login / Register" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  heading: { fontSize: 24, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10 },
});
