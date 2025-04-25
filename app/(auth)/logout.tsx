//app/(auth)/logout.tsx

import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../../utils/supabase';
import {useRouter} from 'expo-router';

const LogoutScreen = ({ navigation }) => {
  const router = useRouter();
  useEffect(() => {
    const signOut = async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        router.replace('/login'); 
      } else {
        console.error('Error signing out:', error.message);
      }
    };

    signOut();
  }, [navigation]);

  return (
    <View className='flex justify-center items-center '>
      <Text>Logging out...</Text>
    </View>
  );
};


export default LogoutScreen;
