"use client"

import { useEffect, useState } from "react"
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Dimensions, 
  StatusBar, 
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform
} from "react-native"
import { useLocalSearchParams, router, Stack } from "expo-router"
import { supabase } from "../../utils/supabase"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

type ProductDetails = {
  id: string
  name: string
  image_url: string
  expiry_date: string
  keywords: string[]
  barcode: string
  quantity: number
}

const { height, width } = Dimensions.get("window")
const MODAL_HEIGHT = height * 0.55 // 55% of screen height for the modal

export default function ProductDetails() {
  const { id } = useLocalSearchParams()
  const [product, setProduct] = useState<ProductDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    fetchProductDetails()
  }, [id])

  async function fetchProductDetails() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("grocery_items").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching product details:", error)
        Alert.alert("Error", "Failed to fetch product details. Please try again.")
      } else {
        setProduct(data)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      Alert.alert("Error", "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!product) return

    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("grocery_items").delete().eq("id", product.id)

            if (error) {
              console.error("Error deleting item:", error)
              Alert.alert("Error", "Failed to delete item. Please try again.")
            } else {
              //Alert.alert("Success", "Item deleted successfully.")
              router.back()
            }
          } catch (error) {
            console.error("Unexpected error during deletion:", error)
            Alert.alert("Error", "An unexpected error occurred.")
          }
        },
      },
    ])
  }

  // Calculate days until expiration
  const getDaysUntilExpiration = () => {
    if (!product) return 0
    
    const today = new Date()
    const expiryDate = new Date(product.expiry_date)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // Get expiration status and color
  const getExpirationStatus = () => {
    const daysLeft = getDaysUntilExpiration()
    
    if (daysLeft < 0) return { text: "Expired", color: "#EF4444" }
    if (daysLeft === 0) return { text: "Expires today", color: "#F59E0B" }
    if (daysLeft <= 3) return { text: `Expires in ${daysLeft} days`, color: "#F59E0B" }
    return { text: `Expires in ${daysLeft} days`, color: "#10B981" }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-600 mt-4">Loading product details...</Text>
      </View>
    )
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-xl font-semibold text-gray-800 mt-4">Product Not Found</Text>
        <Text className="text-gray-600 mt-2 mb-6 text-center px-6">
          We couldn't find the product you're looking for.
        </Text>
        <TouchableOpacity
          className="bg-green-500 py-3 px-6 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const expirationStatus = getExpirationStatus()

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />

      {/* Product Image with Gradient Overlay */}
      <View className="w-full h-2/5">
        {!imageError && product.image_url ? (
          <ImageBackground 
            source={{ uri: product.image_url }} 
            className="w-full h-full"
            resizeMode="cover"
            onError={() => setImageError(true)}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              style={styles.gradient}
            />
          </ImageBackground>
        ) : (
          <View className="w-full h-full bg-gray-200 justify-center items-center">
            <Ionicons name="image-outline" size={80} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">No image available</Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-start">
              <Text className="text-2xl font-bold text-gray-800 flex-1 mr-2">{product.name}</Text>
              
              {/* Quantity Badge */}
              <View className="bg-green-100 px-3 py-2 rounded-full">
                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={18} color="#10B981" />
                  <Text className="ml-1 text-green-800 font-semibold">
                    Qty: {product.quantity || 1}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Expiration Badge */}
            <View className="mt-3 flex-row items-center">
              <View 
                style={{ backgroundColor: `${expirationStatus.color}20` }} 
                className="px-3 py-1 rounded-full flex-row items-center"
              >
                <Ionicons 
                  name={getDaysUntilExpiration() < 0 ? "alert-circle" : "time-outline"} 
                  size={16} 
                  color={expirationStatus.color} 
                />
                <Text style={{ color: expirationStatus.color }} className="ml-1 font-medium">
                  {expirationStatus.text}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Details Section */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Product Details</Text>
            
            <View className="space-y-4">
              {/* Expiration Date */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="calendar-outline" size={20} color="#10B981" />
                </View>
                <View>
                  <Text className="text-gray-500 text-sm">Expiration Date</Text>
                  <Text className="text-gray-800 font-medium">
                    {new Date(product.expiry_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              
              {/* Barcode */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="barcode-outline" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-gray-500 text-sm">Barcode</Text>
                  <Text className="text-gray-800 font-medium">{product.barcode || "Not available"}</Text>
                </View>
              </View>
              
              {/* Quantity */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="cube-outline" size={20} color="#10B981" />
                </View>
                <View>
                  <Text className="text-gray-500 text-sm">Quantity</Text>
                  <Text className="text-gray-800 font-medium">{product.quantity || 1} unit{product.quantity !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Keywords Section */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Keywords</Text>
            <View className="flex-row flex-wrap">
              {product.keywords && product.keywords.length > 0 ? (
                product.keywords.map((keyword, index) => (
                  <View key={index} className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-gray-700">{keyword}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">No keywords available</Text>
              )}
            </View>
          </View>
          
          {/* Actions Section */}
          <View className="mb-8">
            <TouchableOpacity
              className="bg-red-500 py-4 px-4 rounded-xl flex-row items-center justify-center"
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text className="ml-2 text-white font-semibold">Delete Item</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  }
})