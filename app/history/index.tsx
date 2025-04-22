import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { supabase } from '../../utils/supabase'
import { Alert } from 'react-native'
import { useState, useEffect } from 'react'
import GroceryItemCard from '../components/GroceryItemCard'
import { Ionicons } from '@expo/vector-icons'
import { router, Stack } from 'expo-router'

export default function index() {
  const [groceryItems, setGroceryItems] = useState([]);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  useEffect(() => {
    fetchGroceryItems();


    const subscription = supabase
      .channel('grocery_items_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'grocery_items' 
        }, 
        (payload) => {
          console.log('Change received!', payload);
          fetchGroceryItems();
        }
      )
      .subscribe();

      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchGroceryItems() {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .lt('expiry_date', new Date().toISOString())
      .gt("expiry_date", lastWeek.toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching grocery items:', error);
      Alert.alert('Error', 'Failed to fetch grocery items. Please try again.');
    } else {
      setGroceryItems(data);
    }
  }
  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView>
        <View className="p-4">
          {groceryItems.length === 0 ? (
            <Text className="text-center text-gray-500 mt-8">
              You have no expired grocery items.
            </Text>
          ) : (
            groceryItems.map((item) => (
              <GroceryItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                image={item.image_url}
                expiryDate={new Date(item.expiry_date)}
                keywords={item.keywords}
                onDelete={null}
              />
            ))
          )}
        </View>
      </ScrollView>
      <Stack.Screen options={{ headerTitle: "History",   statusBarBackgroundColor: "#16a34a" }} />
    </View>
  );
}