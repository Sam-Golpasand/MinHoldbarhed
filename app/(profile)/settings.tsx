import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trash2, Plus, AlertCircle } from 'lucide-react-native';
import { supabase } from '../../utils/supabase';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      days: [1, 3],
    }
  });
  const [newNotificationDay, setNewNotificationDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserSettings();
  }, []);

  async function fetchUserSettings() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
    
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        router.replace('/login');
        return;
      }
    
      // First try to get existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();
    
      if (error) {
        if (error.code === 'PGRST116') { // No settings found
          // default settings
          const defaultSettings = {
            notifications: { enabled: true, days: [1, 3] },
          };
          
          const { error: saveError } = await supabase
            .from('user_settings')
            .insert({ 
              user_id: user.id,
              settings: defaultSettings 
            });
          
          if (saveError) {
            console.error('Error saving default settings:', saveError);
            Alert.alert('Error', 'Failed to initialize user settings.');
          } else {
            setSettings(defaultSettings);
          }
        } else {
          console.error('Error fetching user settings:', error);
          Alert.alert('Error', 'Failed to load user settings.');
        }
      } else if (data && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserSettings:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading settings.');
    } finally {
      setLoading(false);
    }
  }
  
  async function saveUserSettings(newSettings) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        router.replace('/login');
        return;
      }
    
      const { data, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let saveError;
      
      if (checkError && checkError.code === 'PGRST116') {
        // No settings exist so insert
        const { error } = await supabase
          .from('user_settings')
          .insert({ 
            user_id: user.id,
            settings: newSettings 
          });
        saveError = error;
      } else {
        // Settings exist so update
        const { error } = await supabase
          .from('user_settings')
          .update({ settings: newSettings })
          .eq('user_id', user.id);
        saveError = error;
      }
    
      if (saveError) {
        console.error('Error saving user settings:', saveError);
        Alert.alert('Error', 'Failed to save user settings.');
      } else {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Unexpected error in saveUserSettings:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving settings.');
    } finally {
      setSaving(false);
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

    // Check if day already exists
    if (settings.notifications.days.includes(day)) {
      Alert.alert('Info', 'This notification day already exists.');
      setNewNotificationDay('');
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-600 mt-4">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView>
        <View className="px-6 py-8">
          <Text className="text-2xl font-bold mb-6 text-gray-800">Settings</Text>
          
          <View className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">Notifications</Text>
              {saving && <ActivityIndicator size="small" color="#16a34a" style={{ marginLeft: 10 }} />}
            </View>
            
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <View>
                <Text className="text-gray-800 font-medium">Enable Notifications</Text>
                <Text className="text-gray-500 text-sm">Receive reminders about your tasks</Text>
              </View>
              <Switch
                value={settings.notifications.enabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#cbd5e1", true: "#86efac" }}
                thumbColor={settings.notifications.enabled ? "#16a34a" : "#f4f4f5"}
              />
            </View>
            
            <View className="py-3">
              <Text className="font-medium text-gray-800 mb-2">Notification Days:</Text>
              {settings.notifications.days.length === 0 ? (
                <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
                  <AlertCircle size={18} color="#94a3b8" />
                  <Text className="text-gray-500 ml-2">No notification days set</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap">
                  {settings.notifications.days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      className="bg-green-500 rounded-full px-3 py-2 m-1 flex-row items-center"
                      onPress={() => removeNotificationDay(day)}
                    >
                      <Text className="text-white font-medium">{day} day{day !== 1 ? 's' : ''}</Text>
                      <Trash2 size={14} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View className="flex-row mt-4">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-gray-800"
                  placeholder="Add days"
                  keyboardType="numeric"
                  value={newNotificationDay}
                  onChangeText={setNewNotificationDay}
                />
                <TouchableOpacity
                  className="bg-green-500 rounded-r-lg px-4 py-2 flex-row items-center"
                  onPress={addNotificationDay}
                >
                  <Plus size={18} color="white" />
                  <Text className="text-white font-semibold ml-1">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Stack.Screen 
        options={{ 
          headerTitle: "Settings",
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
    </View>
  );
}