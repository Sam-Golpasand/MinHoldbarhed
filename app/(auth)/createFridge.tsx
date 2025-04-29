import React, { useState, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard,
  Alert, 
  SafeAreaView
} from "react-native";
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useNavigation } from "@react-navigation/native"

export default function CreateFridge() {
  const navigation = useNavigation()
  const [fridgeName, setFridgeName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  async function handleCreateFridge() {

    function generateShareCode(length = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    }

    if (!fridgeName.trim()) {
      Alert.alert('Please enter a fridge name.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not logged in.');
      }

      // 1. Create fridge
      const { data: fridgeData, error: fridgeError } = await supabase
        .from('fridges')
        .insert([{ name: fridgeName, share_code: generateShareCode()  }])
        .select()
        .single();

      if (fridgeError) throw fridgeError;

      // 2. Link fridge to user
      const { error: linkError } = await supabase
        .from('user_fridge')
        .insert([{ user_id: user.id, fridge_id: fridgeData.id}]);

      if (linkError) throw linkError;

      // 3. Redirect to home or wherever
      router.replace('/home');

    } catch (error: any) {
      console.error('Error creating fridge:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleJoinFridge() {
    if (!joinCode.trim()) {
      Alert.alert('Please enter a fridge code.');
      return;
    }
  
    setJoining(true);
  
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not logged in");
  
      const { data: fridgeData, error: fridgeError } = await supabase
        .from("fridges")
        .select("*")
        .eq("share_code", joinCode.trim().toUpperCase())
        .single();
  
      if (fridgeError || !fridgeData) {
        Alert.alert("Error", "No fridge found with that code.");
        return;
      }
  
      const { error: linkError } = await supabase
        .from("user_fridge")
        .insert([{ user_id: user.id, fridge_id: fridgeData.id }]);
  
      if (linkError) throw linkError;
  
      router.replace('/home');
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong while joining.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View className="flex-1 px-8 pt-12 pb-8">
              {/* Header */}
              <View className="items-center mb-12 mt-20">
                <Text className="text-3xl font-bold text-gray-800">Welcome</Text>
                <Text className="text-base text-gray-500 mt-2">Create your first Fridge</Text>
              </View>

              {/* Input field */}
              <View className="space-y-6 mt-10">
                <View>
                  <View className="flex-row items-center border-b border-gray-300 pb-2">
                    <TextInput
                      className="flex-1 text-base text-gray-700"
                      placeholder="Enter fridge name"
                      value={fridgeName}
                      onChangeText={setFridgeName}
                      returnKeyType="done"
                      onSubmitEditing={handleCreateFridge}
                    />
                  </View>
                </View>
              </View>

              {/* Save button */}
              <TouchableOpacity
                className={`bg-green-600 py-2 rounded-xl mt-4 ${saving ? "opacity-70" : ""}`}
                onPress={handleCreateFridge}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold text-lg">Save Fridge</Text>
                )}
              </TouchableOpacity>
              {/* OR Separator */}
              <View className="flex-row items-center mb-4 mt-10">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500 font-medium">Or join by Fridge Code</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Join fridge by code */}
              <View>
                <View className="flex-row items-center border-b border-gray-300 pb-2 mb-4">
                  <TextInput
                    className="flex-1 text-base text-gray-700"
                    placeholder="Enter fridge code"
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleJoinFridge}
                  />
                </View>

                <TouchableOpacity
                  className={`bg-white border-2 border-green-600 py-2 rounded-xl ${joining ? "opacity-70" : ""}`}
                  onPress={handleJoinFridge}
                  disabled={joining}
                >
                  {joining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-green-600 text-center font-bold text-lg">Join Fridge</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
