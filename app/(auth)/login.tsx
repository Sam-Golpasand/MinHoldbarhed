"use client"

import { useState, useLayoutEffect, useRef } from "react"
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
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
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
  const scrollViewRef = useRef(null)
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

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

  // Function to scroll to the input field when focused
  const handleFocus = (inputRef) => {
    // Add a small delay to ensure the keyboard is fully shown
    setTimeout(() => {
      if (scrollViewRef.current && inputRef.current) {
        inputRef.current.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            scrollViewRef.current.scrollTo({
              y: y - 100, 
              animated: true,
            })
          },
          () => console.log("Failed to measure")
        )
      }
    }, 100)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-8 pt-12 pb-8">
              <View className="items-center mt-8 mb-12">
                <Image source={require("../../public/profile.png")} className="w-40 h-40 rounded-lg mb-4" resizeMode="contain" />
                <Text className="text-3xl font-bold text-gray-800">Welcome back</Text>
                <Text className="text-base text-gray-500 mt-2">Sign in to continue</Text>
              </View>

              <View className="space-y-6">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <View className="flex-row items-center border-b border-gray-300 pb-2">
                    <Mail size={20} color="#6B7280" />
                    <TextInput
                      ref={emailInputRef}
                      className="flex-1 text-base text-gray-700 ml-3"
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => handleFocus(emailInputRef)}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                  <View className="flex-row items-center border-b border-gray-300 pb-2">
                    <Lock size={20} color="#6B7280" />
                    <TextInput
                      ref={passwordInputRef}
                      className="flex-1 text-base text-gray-700 ml-3"
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      onFocus={() => handleFocus(passwordInputRef)}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                  </View>
                </View>

                <TouchableOpacity className="self-end">
                  <Text className="text-sm text-green-600 font-medium">Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className={`bg-green-600 py-4 rounded-xl mt-10 ${loading ? "opacity-70" : ""}`}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-10 mb-6">
                <Text className="text-gray-600">Don't have an account? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text className="text-green-600 font-bold">Register</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}