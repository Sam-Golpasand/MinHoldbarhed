import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";
import { User, Settings, Mail, LogOut } from "lucide-react-native";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setLoading(false);
        return;
      }
      
      // First, set the auth user data
      setUser(authUser);
      
      // Then fetch the profile data using the user's email instead of ID
      // This avoids the UUID/bigint mismatch
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", authUser.email) 
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-gray-600">Please log in to view your profile</Text>
        <TouchableOpacity
          className="bg-blue-500 py-3 px-6 rounded-lg mt-4"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-white font-bold">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Combine user and profile data
  const userData = {
    ...user,
    ...(profile || {}),
    // Ensure we always have these fields
    username: profile?.username || user.email?.split('@')[0] || "User",
    email: user.email,
  };

  return (
    <ScrollView className="bg-gray-100 flex-1">
      <View className="px-6 py-8">
        {/* Profile Header */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <View className="bg-green-500 h-32" />
          <View className="px-6 pb-6 -mt-14">
            <View className="flex items-center">
              <View className="bg-gray-200 rounded-full p-1 border-4 border-white">
                {userData?.avatar_url ? (
                  <Image 
                    source={{ uri: userData.avatar_url }} 
                    className="w-28 h-28 rounded-full"
                  />
                ) : (
                  <View className="w-28 h-28 rounded-full bg-gray-300 justify-center items-center">
                    <User size={40} color="#64748b" />
                  </View>
                )}
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-4">
                {userData.username}
              </Text>
              <View className="flex-row items-center mt-1">
                <Mail size={16} color="#64748b" />
                <Text className="text-base text-gray-600 ml-2">{userData.email}</Text>
              </View>
              {userData?.bio && (
                <Text className="text-gray-600 text-center mt-3 px-4">{userData.bio}</Text>
              )}
            </View>
          </View>
        </View>

        <View className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">Account</Text>
          
          <TouchableOpacity
            className="flex-row items-center py-3 border-b border-gray-100"
            
          >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
              <User size={20} color="#3b82f6" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-800 font-medium">Edit Profile</Text>
              <Text className="text-gray-500 text-sm">COMING SOON...</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-row items-center py-3 border-b border-gray-100"
            onPress={() => router.push("/settings")}
          >
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
              <Settings size={20} color="#16a34a" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-800 font-medium">Settings</Text>
              <Text className="text-gray-500 text-sm">Manage your preferences</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={handleLogout}
          >
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
              <LogOut size={20} color="#ef4444" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-800 font-medium">Log Out</Text>
              <Text className="text-gray-500 text-sm">Sign out of your account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}