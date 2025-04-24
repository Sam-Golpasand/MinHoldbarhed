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
import { Lock, Mail, User, ArrowLeft } from "lucide-react-native"
import { useNavigation } from "@react-navigation/native"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const navigation = useNavigation()
  const scrollViewRef = useRef(null)
  const nameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  const handleRegister = async () => {
    if (email === "" || password === "" || name === "") {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      // Step 1: Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (authError) throw authError;
      
      if (authData.user) {
        // Step 2: Create a profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,  // Use the UUID from auth
            email: email,
            username: name,
          });
          
        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Continue with registration even if profile creation fails
        }
        
        // Step 3: Create default settings for the user
        const defaultSettings = {
          notifications: { enabled: true, days: [1, 3] },
        };
        
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({ 
            user_id: authData.user.id,
            settings: defaultSettings 
          });
          
        if (settingsError) {
          console.error("Error creating settings:", settingsError);
          // Continue with registration even if settings creation fails
        }
      }

      /*Alert.alert(
        "Registration Successful", 
        "Please check your email to verify your account.", 
        [{ text: "OK", onPress: () => router.replace("/login") }]
      ); */
      
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", error.message || "Failed to create account");
    } finally {
      setLoading(false);
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
              y: y - 100, // Scroll to position with some extra space
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
              {/* Logo and welcome text */}
              <View className="items-center mt-8 mb-12">
                <Image source={require("../../public/profile.png")} className="w-20 h-20 mb-4" resizeMode="contain" />
                <Text className="text-3xl font-bold text-gray-800">Create Account</Text>
                <Text className="text-base text-gray-500 mt-2">Sign up to get started</Text>
              </View>

              {/* Form fields */}
              <View className="space-y-6">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
                  <View className="flex-row items-center border-b border-gray-300 pb-2">
                    <User size={20} color="#6B7280" />
                    <TextInput
                      ref={nameInputRef}
                      className="flex-1 text-base text-gray-700 ml-3"
                      placeholder="Enter your full name"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => handleFocus(nameInputRef)}
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                    />
                  </View>
                </View>

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
                      placeholder="Create a password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      onFocus={() => handleFocus(passwordInputRef)}
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                    />
                  </View>
                </View>
              </View>

              {/* Register button */}
              <TouchableOpacity
                className={`bg-green-600 py-4 rounded-xl mt-10 ${loading ? "opacity-70" : ""}`}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
              </TouchableOpacity>

              {/* Login link */}
              <View className="flex-row justify-center mt-10 mb-6">
                <Text className="text-gray-600">Already have an account? </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-green-600 font-bold">Sign In</Text>
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