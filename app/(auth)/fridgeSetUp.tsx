import { Redirect, useRouter } from "expo-router";
import { supabase } from '../../utils/supabase';
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';

export default function FridgeSetUp() {
  const [loading, setLoading] = useState(true);
  const [hasFridge, setHasFridge] = useState(false);
  const router = useRouter();
  useEffect(() => {
    fetchUserFridges();
  })
  
  const fetchUserFridges = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        router.replace('/login');
        return;
      }
    
      // First try to get existing fridges
      const { data: fridgeLinks, error } = await supabase
        .from('user_fridge')
        .select('fridges(*)')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error fetching user fridges:", error);
      }
      if (fridgeLinks && fridgeLinks.length > 0) {
        setHasFridge(true);
      }
      
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <Loading />
    );
  }
  
  return hasFridge ? <Redirect href="/home" /> : <Redirect href="/createFridge" />;
}