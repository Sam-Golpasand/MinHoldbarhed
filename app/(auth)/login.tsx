"use client"

import { useState, useLayoutEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { supabase } from "../../utils/supabase"
import { Lock, Mail, ArrowLeft } from "lucide-react-native"
import { useNavigation } from "@react-navigation/native"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  const handleLogin = async () => {
    if (email === "" || password === "") {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      Alert.alert("Error", error.message)
    } else {
      router.replace("/home")
    }
  }

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
    if (error) {
      Alert.alert("Error", error.message)
    } else {
      router.replace("/home") // Redirect on success
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1 px-8 pt-12">

          {/* Logo and welcome text */}
          <View className="items-center mt-8 mb-12">
            <Image source={require("../../public/profile.png")} className="w-20 h-20 mb-4" resizeMode="contain" />
            <Text className="text-3xl font-bold text-gray-800">Welcome back</Text>
            <Text className="text-base text-gray-500 mt-2">Sign in to continue</Text>
          </View>

          {/* Form fields */}
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <View className="flex-row items-center border-b border-gray-300 pb-2">
                <Mail size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 text-base text-gray-700 ml-3"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <View className="flex-row items-center border-b border-gray-300 pb-2">
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 text-base text-gray-700 ml-3"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity className="self-end">
              <Text className="text-sm text-green-600 font-medium">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <TouchableOpacity
            className={`bg-green-600 py-4 rounded-xl mt-10 ${loading ? "opacity-70" : ""}`}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-lg">{loading ? "Signing in..." : "Sign In"}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500">or continue with</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Google sign in */}
          <TouchableOpacity
            className="bg-white border border-gray-300 py-4 rounded-xl flex-row justify-center items-center"
            onPress={handleGoogleSignIn}
          >
            <Image source={require("../../public/google-logo.png")} className="w-5 h-5 mr-3" resizeMode="contain" />
            <Text className="text-gray-700 font-semibold text-base">Sign in with Google</Text>
          </TouchableOpacity>

          {/* Register link */}
          <View className="flex-row justify-center mt-10 mb-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-green-600 font-bold">Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
