import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      days: [1, 3],
    }
  });
  const [newNotificationDay, setNewNotificationDay] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserSettings();
  }, []);

  async function fetchUserSettings() {
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }
  
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single();
  
    if (error) {
      if (error.code === 'PGRST116') { // No settings found
        const defaultSettings = {
          notifications: { enabled: true, days: [1, 3] },
        };
        await saveUserSettings(defaultSettings);
        // Re-fetch settings after upsert to ensure state is in sync with DB
        const { data: refetched } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single();
        if (refetched && refetched.settings) {
          setSettings(refetched.settings);
        } else {
          setSettings(defaultSettings); // fallback
        }
      } else {
        console.error('Error fetching user settings:', error);
        Alert.alert('Error', 'Failed to load user settings.');
      }
    } else if (data) {
      setSettings(data.settings);
    }
  }
  

  async function saveUserSettings(newSettings) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }
  
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, settings: newSettings },
        { onConflict: 'user_id' } // Handle conflicts on user_id
      );
  
    if (error) {
      console.error('Error saving user settings:', error);
      Alert.alert('Error', 'Failed to save user settings.');
    } else {
      setSettings(newSettings);
    }
  }
  

  function toggleNotifications() {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        enabled: !settings.notifications.enabled,
      },
    };
    saveUserSettings(newSettings);
  }

  function addNotificationDay() {
    const day = parseInt(newNotificationDay);
    if (isNaN(day) || day < 0) {
      Alert.alert('Error', 'Please enter a valid number of days.');
      return;
    }

    const newDays = [...settings.notifications.days, day].sort((a, b) => a - b);
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        days: newDays,
      },
    };
    saveUserSettings(newSettings);
    setNewNotificationDay('');
  }

  function removeNotificationDay(day) {
    const newDays = settings.notifications.days.filter(d => d !== day);
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        days: newDays,
      },
    };
    saveUserSettings(newSettings);
  }

  return (
    <View className="flex-1 bg-gray-100">
      <View className="px-6 py-12">
        <Text className="text-2xl font-bold mb-6">Settings</Text>
        <View className="bg-white p-6 rounded-xl shadow-sm">
          <Text className="text-lg font-bold mb-4">Notifications</Text>
          <View className="flex-row justify-between items-center py-2">
            <Text>Enable Notifications</Text>
            <Switch
              value={settings.notifications.enabled}
              onValueChange={toggleNotifications}
            />
          </View>
          <Text className="font-semibold mt-4 mb-2">Notification Days:</Text>
          <View className="flex-row flex-wrap">
            {settings.notifications.days.map((day) => (
              <TouchableOpacity
                key={day}
                className="bg-blue-500 rounded-full px-3 py-1 m-1"
                onPress={() => removeNotificationDay(day)}
              >
                <Text className="text-white">{day} day{day !== 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row mt-4">
            <TextInput
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2"
              placeholder="Add days"
              keyboardType="numeric"
              value={newNotificationDay}
              onChangeText={setNewNotificationDay}
            />
            <TouchableOpacity
              className="bg-green-500 rounded-r-lg px-4 py-2"
              onPress={addNotificationDay}
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Stack.Screen options={{ headerTitle: "Settings",   statusBarBackgroundColor: "#16a34a" }} />
    </View>
    
  );
}