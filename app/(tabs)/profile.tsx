//app/(tabs)/profile.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";
import { Mail, LogOut } from "lucide-react-native";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        Alert.alert("Error", "Failed to fetch user profile");
      } else {
        setUser({ ...user, ...data });
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", "Failed to log out");
    } else {
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-gray-100 flex-1">
      <View className="px-6 py-12">
        <View className="bg-white p-6 rounded-xl shadow-sm">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {user?.username || "User"}
            </Text>
            <Text className="text-base text-gray-600">{user?.email}</Text>
          </View>
          <TouchableOpacity
            className="bg-blue-500 py-3 rounded-lg mb-4"
            onPress={() => router.push("/edit-profile")}
          >
            <Text className="text-white text-center font-bold text-lg">
              Edit Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-lg mb-4"
            onPress={() => router.push("/settings")}
          >
            <Text className="text-white text-center font-bold text-lg">
              Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-200 py-3 rounded-lg"
            onPress={handleLogout}
          >
            <Text className="text-gray-700 text-center font-bold text-lg">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
