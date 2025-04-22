"use client"

import { useEffect, useState } from "react"
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, Dimensions, StatusBar, StyleSheet } from "react-native"
import { useLocalSearchParams, router, Stack } from "expo-router"
import { supabase } from "../../utils/supabase"
import { Ionicons } from "@expo/vector-icons"

type ProductDetails = {
  id: string
  name: string
  image_url: string
  expiry_date: string
  keywords: string[]
  barcode: string
}

const { height } = Dimensions.get("window")
const MODAL_HEIGHT = height * 0.45 // 45% of screen height for the modal

export default function ProductDetails() {
  const { id } = useLocalSearchParams()
  const [product, setProduct] = useState<ProductDetails | null>(null)

  useEffect(() => {
    fetchProductDetails()
  }, [id])

  async function fetchProductDetails() {
    const { data, error } = await supabase.from("grocery_items").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching product details:", error)
      Alert.alert("Error", "Failed to fetch product details. Please try again.")
    } else {
      setProduct(data)
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
          const { error } = await supabase.from("grocery_items").delete().eq("id", product.id)

          if (error) {
            console.error("Error deleting item:", error)
            Alert.alert("Error", "Failed to delete item. Please try again.")
          } else {
            Alert.alert("Success", "Item deleted successfully.")
            router.back()
          }
        },
      },
    ])
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />

      {/* Full screen image */}
      <Image source={{ uri: product.image_url }} className="absolute w-full h-full" resizeMode="cover" />

      {/* Back button */}
      <TouchableOpacity
        className="absolute top-12 left-4 z-10 bg-black/30 p-2 rounded-full"
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Fixed height bottom modal */}
      <View style={[styles.modalContainer, { height: MODAL_HEIGHT }]}>
        <ScrollView className="flex-1 px-6">
          <Text className="text-2xl font-bold mb-2 mt-2">{product.name}</Text>

          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
            <Text className="ml-2 text-gray-600">Expires on: {new Date(product.expiry_date).toLocaleDateString()}</Text>
          </View>

          <Text className="text-lg font-semibold mb-2">Keywords</Text>
          <View className="flex-row flex-wrap mb-4">
            {product.keywords.map((keyword, index) => (
              <View key={index} className="bg-gray-200 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-sm text-gray-700">{keyword}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center mb-6">
            <Ionicons name="barcode-outline" size={20} color="#4B5563" />
            <Text className="ml-2 text-gray-600">Barcode: {product.barcode}</Text>
          </View>

          <TouchableOpacity
            className="bg-red-500 py-3 px-4 rounded-lg flex-row items-center justify-center mb-6"
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text className="ml-2 text-white font-semibold">Delete Item</Text>
          </TouchableOpacity>
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
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
})
