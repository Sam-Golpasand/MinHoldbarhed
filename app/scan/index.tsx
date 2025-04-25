"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Modal, Animated, Alert, TextInput, Image, StyleSheet } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"

import { router, Stack } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import DateTimePicker from "@react-native-community/datetimepicker"
import { supabase } from "../../utils/supabase"
import * as Notifications from "expo-notifications"
// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function Scan() {
  // State declarations
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [flash, setFlash] = useState(false)
  const [barcodeData, setBarcodeData] = useState("")
  const [productInfo, setProductInfo] = useState({ product_name: "", keywords: [], image_url: "" })
  const [modalVisible, setModalVisible] = useState(false)
  const [expirationDate, setExpirationDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [modalAnimation] = useState(new Animated.Value(0))
  const [user, setUser] = useState(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [userSettings, setUserSettings] = useState({
    notifications: {
      enabled: true,
      days: [1, 3],
    },
    language: "en",
  })
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Effect to run on component mount
  useEffect(() => {
    checkUser()
    requestNotificationPermissions()
    fetchUserSettings()
  }, [])

  // Function to check if user is logged in
  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    if (!user) {
      Alert.alert("Not logged in", "Please log in to scan and save items.")
      router.replace("/login")
    }
  }

  // Function to request notification permissions
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Warning", "You need to grant notification permissions to receive expiration reminders.")
    }
  }

  // Function to fetch user settings
  const fetchUserSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert("Error", "User not logged in")
        return
      }

      const { data, error } = await supabase.from("user_settings").select("settings").eq("user_id", user.id).single()

      if (error) {
        console.error("Error fetching user settings:", error)
      } else if (data) {
        setUserSettings(data.settings)
      }
    } catch (error) {
      console.error("Error in fetchUserSettings:", error)
    }
  }

  // Function to toggle flash
  const handleFlashToggle = () => {
    setFlash(!flash)
  }

  // Function to handle barcode scanning
  const handleBarCodeScanned = async ({ type, data }) => {
    await fetchProductData(data)
  }

  // Function to handle manual barcode input
  const handleManualSubmit = async () => {
    if (manualBarcode.length > 0) {
      await fetchProductData(manualBarcode)
      setShowManualInput(false)
      setManualBarcode("")
    } else {
      Alert.alert("Error", "Please enter a valid barcode.")
    }
  }

  // Function to create a product with default values
  const createDefaultProduct = (barcode) => {
    return {
      product_name: "Unknown Product",
      _keywords: ["unknown", "product", barcode],
      image_url: null
    }
  }

  // Function to fetch product data from API
  const fetchProductData = async (barcode) => {
    setScanned(true)
    setBarcodeData(barcode)
    setIsLoading(true)

    try {
      const response = await axios.get(
        `https://world.openfoodfacts.net/api/v3/product/${barcode}?lc=${userSettings.language}`,
        { timeout: 10000 } // Add timeout to prevent long waits
      )
      
      // Process the product data
      const productData = response.data.product || createDefaultProduct(barcode)
      processProductData(productData, barcode)
    } catch (error) {
      console.error("Error fetching product data:", error)
      
      // Handle 404 errors gracefully
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Product not found, create a default product
        const defaultProduct = createDefaultProduct(barcode)
        processProductData(defaultProduct, barcode)
      } else {
        // Handle other errors
        Alert.alert(
          "Product Not Found", 
          "This product wasn't found in our database. You can still add it manually.",
          [
            { text: "Cancel", onPress: () => setScanned(false), style: "cancel" },
            { text: "Add Manually", onPress: () => processProductData(createDefaultProduct(barcode), barcode) }
          ]
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Function to process product data
  const processProductData = (productData, barcode) => {
    // Ensure we have keywords, even if they're default ones
    const keywords = productData._keywords || ["unknown", "product", barcode]
    const productName = productData.product_name || "Unknown Product"

    // Default to 7 days expiration
    const defaultExpirationDate = new Date()
    defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 7)

    setProductInfo({
      product_name: productName,
      keywords,
      image_url: productData.image_url || null,
    })
    setExpirationDate(defaultExpirationDate)
    setModalVisible(true)
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

// Function to schedule notifications
  const scheduleNotifications = async (productName, expirationDate) => {
    if (!userSettings.notifications.enabled) return

    try {
      for (const day of userSettings.notifications.days) {
        const notificationDate = new Date(expirationDate)
        notificationDate.setDate(notificationDate.getDate() - day)
        
        // Check if the date is in the future
        if (notificationDate > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Expiration Reminder",
              body: `${productName} will expire in ${day} day${day > 1 ? "s" : ""}!`,
            },
            trigger: {
              date: notificationDate,
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            },
          })
        }
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error)
    }
  }

  // Function to save item to database
  const saveItemToDatabase = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save items.")
      return
    }

    try {
      const { data, error } = await supabase.from("grocery_items").insert({
        user_id: user.id,
        name:
          productInfo.product_name === "Unknown Product"
            ? productInfo.keywords.slice(0, 2).join(" ")
            : productInfo.product_name,
        image_url: productInfo.image_url,
        expiry_date: expirationDate.toISOString(),
        keywords: productInfo.keywords.slice(0, 5),
        barcode: barcodeData,
        quantity: quantity,
      })

      if (error) {
        console.error("Error saving item to database:", error)
        Alert.alert("Error", "Failed to save item to database.")
      } else {
        //Alert.alert("Success", "Item saved successfully!")

        // Schedule notifications based on user settings
        await scheduleNotifications(productInfo.product_name, expirationDate)

        closeModal()
      }
    } catch (error) {
      console.error("Error in saveItemToDatabase:", error)
      Alert.alert("Error", "An unexpected error occurred while saving the item.")
    }
  }

  // Function to handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || expirationDate
    setShowDatePicker(false)
    setExpirationDate(currentDate)
  }

  // Function to close modal
  const closeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false)
      setScanned(false)
    })
  }



  // Render loading state
  if (!permission) {
    return <View />
  }

  // Render permission request
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-center mb-4">We need your permission to show the camera</Text>
        <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg" onPress={requestPermission}>
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 justify-center">
      <CameraView
        className="flex-1"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={flash}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8"],
        }}
      >
        {/* Back button */}
        <View className="absolute top-12 left-4 z-50">
          <TouchableOpacity
            className="w-12 h-12 bg-green-600 rounded-full items-center justify-center"
            onPress={() => {
              if (router.canGoBack()) {
                router.back()
              } else {
                Alert.alert("No previous screen", "Returning to Home")
                router.push("/home")
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Flash toggle button */}
        <View className="absolute top-12 right-4">
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-green-600 justify-center items-center"
            onPress={handleFlashToggle}
          >
            <Ionicons name={flash ? "flash-outline" : "flash-off-outline"} color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Manual barcode input button */}
        <View className="absolute bottom-12 left-1/4 -ml-20">
          <TouchableOpacity
            className="w-20 h-12 rounded-full justify-center items-center"
            onPress={() => setShowManualInput(true)}
          >
            <Ionicons name="create" size={42} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scan overlay */}
        <View className="flex-1 justify-center items-center">
          <View className="w-72 h-72 justify-center items-center">
            <Ionicons name="scan-outline" color="#fff" size={300} />
          </View>
        </View>
      </CameraView>

      {/* Product info modal */}
      <Modal animationType="none" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackground} className="flex-1 justify-end">
          <Animated.View
            className="bg-white rounded-t-3xl p-6"
            style={{
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
              opacity: modalAnimation,
            }}
          >
            {/* Product Info Header */}
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-gray-800">
                  {productInfo.product_name === "Unknown Product"
                    ? productInfo.keywords.slice(0, 2).join(" ")
                    : productInfo.product_name}
                </Text>
                <Text className="text-sm text-gray-500">Barcode: {barcodeData}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} className="bg-gray-100 rounded-full p-2">
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-5">
              <View className="w-1/3 mr-4 items-center justify-start">
                {productInfo.image_url ? (
                  <View className="bg-white rounded-xl overflow-hidden shadow-sm w-full aspect-square border border-gray-200">
                    <Image
                      source={{ uri: productInfo.image_url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View className="bg-gray-100 rounded-xl w-full aspect-square items-center justify-center border border-gray-200">
                    <Ionicons name="image-outline" size={50} color="#666" />
                    <Text className="text-gray-500 text-xs mt-2 text-center">No image available</Text>
                  </View>
                )}

                {/* Quantity selector */}
                <View className="mt-4 w-full">
                  <Text className="text-base font-semibold text-gray-700 mb-2">Quantity:</Text>
                  <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-2 border border-gray-200">
                    <TouchableOpacity
                      className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>

                    <View className="bg-white px-4 py-1 rounded-lg border border-gray-200">
                      <Text className="text-lg font-bold text-gray-800">{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      className="w-8 h-8 bg-green-500 rounded-full items-center justify-center"
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View className="flex-1">
                <View className="mb-4">
                  <Text className="text-base font-semibold text-gray-700 mb-2">Keywords:</Text>
                  <View className="flex-row flex-wrap">
                    {productInfo.keywords.slice(0, 5).map((keyword, index) => (
                      <View key={index} className="bg-green-50 rounded-full px-3 py-1 m-1 border border-green-100">
                        <Text className="text-sm text-green-700">{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Expiration Date Picker Section */}
                <View className="mb-4">
                  <Text className="text-base font-semibold text-gray-700 mb-2">Expiration Date:</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="flex-row items-center bg-gray-50 p-3 rounded-xl shadow-sm border border-gray-200"
                  >
                    <View className="bg-green-100 rounded-full p-2 mr-3">
                      <Ionicons name="calendar" size={20} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500">Expires on</Text>
                      <Text className="text-base font-medium text-gray-800">{expirationDate.toDateString()}</Text>
                    </View>
                    <View className="bg-green-50 rounded-lg px-3 py-1 border border-green-100">
                      <Text className="text-green-700 font-medium text-sm">Change</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker value={expirationDate} mode="date" display="default" onChange={onDateChange} />
                )}
              </View>
            </View>

            {/* Buttons Section */}
            <View className="mt-4 border-t border-gray-200 pt-4">
              <View className="flex-row justify-between space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-white border-2 border-green-500 rounded-xl py-3 px-4 flex-row items-center justify-center"
                  onPress={saveItemToDatabase}
                >
                  <Ionicons name="scan-outline" size={20} color="#22c55e" className="mr-2" />
                  <Text className="text-green-600 font-semibold text-base ml-2">Save & Scan Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-green-500 rounded-xl py-3 px-4 flex-row items-center justify-center"
                  onPress={() => {
                    saveItemToDatabase()
                    closeModal()
                    router.push("/home")
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" className="mr-2" />
                  <Text className="text-white font-semibold text-base ml-2">Save & Finish</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Manual barcode input modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showManualInput}
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalBackground} className="flex-1 justify-center items-center">
          <View className="bg-white p-6 rounded-xl w-80 shadow-lg">
            <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">Enter Barcode</Text>

            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 text-lg"
              placeholder="Enter barcode number"
              keyboardType="numeric"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              autoFocus
            />

            {/* Buttons */}
            <View className="flex-row justify-around mt-4">
              <TouchableOpacity className="bg-gray-500 rounded-lg py-2 px-6" onPress={() => setShowManualInput(false)}>
                <Text className="text-white font-semibold text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-green-500 rounded-lg py-2 px-6" onPress={handleManualSubmit}>
                <Text className="text-white font-semibold text-lg">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={[styles.modalBackground, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]} className="flex-1 justify-center items-center">
          <View className="bg-white p-6 rounded-xl shadow-lg items-center">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Searching for product...</Text>
            <View className="h-8 w-8 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </View>
        </View>
      )}

      <Stack.Screen options={{ headerShown: false }} />
    </View>
  )
}

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
})