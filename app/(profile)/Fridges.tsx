import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trash2, Plus, AlertCircle } from 'lucide-react-native';
import { supabase } from '../../utils/supabase';
interface Fridge {
  name: string;
}

export function Fridges() {

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fridgeId, setFridgeId] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fridgesData, setFridgesData] = useState([]);

  const router = useRouter();

  useEffect(() => {
    fetchFridgeId();
  }, [])

  async function fetchFridgeId() {
    setLoading(true)
    try {
      //get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        router.replace('/login');
        return;
      }
      //get users fridgeId's
      const {data: fridgesId, error} = await supabase
        .from('profiles')
        .select('fridge_id')
        .eq('user_id', user.id)
      if (error) {
        setFetchError('could not fetch fridge Id\'s');
        console.error('could not fetch fridge Id\'s', error);
      }
      if (fridgesId) {
        setFridgeId(fridgesId)
        await fetchUserFridges()
      }
      return 
    } catch (error) {
      console.error('Error fetching fridge Id\'s:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading fridge Id\'s.');
    } finally {
      setLoading(false)
    }
    
  }

  async function fetchUserFridges (){
    setLoading(true)
    try {
      const fridgeIds = fridgeId.map(f => f.fridge_id);

      if (!fridgeIds.length) {
        console.error('No fridge IDs found for user');
        return;
      }
      //get data from fridge id's
      const {data: fridgesData, error} = await supabase
        .from('fridges')
        .select('*')
        .in('id', fridgeIds)
      
      if(error){
        setFetchError('could not fetch user fridges');
        console.error('could not fetch user fridges', error);
      }
      if(fridgesData){
        setFridgesData(fridgesData)
      }
    } catch (error) {
      console.error('Error fetching fridge Id\'s:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading fridge Id\'s.');
    }
      
  } 

  return (
    <View className="bg-white p-6 rounded-xl shadow-sm mb-6">
      <View className="flex-row items-center mb-4">
        <Text className="text-lg font-bold text-gray-800">Fridges</Text>
        {saving && <ActivityIndicator size="small" color="#16a34a" style={{ marginLeft: 10 }} />}
      </View>
      {fridgesData.map((fridge) => (
        <FridgeModule key={fridge.Id} name={fridge.name}/>
      ))}
    </View>
      
  )
}

function FridgeModule({name}: Fridge){
  return(
    <View>
      <Text>{name}</Text>
    </View>
  )
}