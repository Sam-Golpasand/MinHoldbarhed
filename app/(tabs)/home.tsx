"use client"

import { useEffect, useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput } from "react-native"
import { router, useNavigation } from "expo-router"
import GroceryItemCard from "../components/GroceryItemCard"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../utils/supabase"

export default function Home() {
  const [groceryItems, setGroceryItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigation = useNavigation()

  const fetchGroceryItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .gt("expiry_date", new Date().toISOString())
        .order("expiry_date", { ascending: true })

      if (error) {
        throw error
      }

      console.log("Fetched grocery items:", data)
      setGroceryItems(data)
      setFilteredItems(data) // Initially display all items
    } catch (error) {
      console.error("Error fetching grocery items:", error)
      Alert.alert("Error", "Failed to fetch grocery items. Please try again.")
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchGroceryItems()
    setRefreshing(false)
  }, [fetchGroceryItems])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === "") {
      setFilteredItems(groceryItems)
    } else {
      const filtered = groceryItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      setFilteredItems(filtered)
    }
  }

  useEffect(() => {
    fetchGroceryItems()

    const subscription = supabase
      .channel("grocery_items_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
        },
        (payload) => {
          console.log("Change received!", payload)
          fetchGroceryItems()
        },
      )
      .subscribe()

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/history")} className="mr-4">
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchGroceryItems, navigation])

  const handleDelete = useCallback(
    async (itemId) => {
      try {
        const { error } = await supabase.from("grocery_items").delete().eq("id", itemId)

        if (error) {
          throw error
        }

        Alert.alert("Success", "Item deleted successfully.")
        fetchGroceryItems()
      } catch (error) {
        console.error("Error deleting item:", error)
        Alert.alert("Error", "Failed to delete item. Please try again.")
      }
    },
    [fetchGroceryItems],
  )

  return (
    <View className="flex-1 bg-gray-100">
      {/* Search Bar */}
      <View className="p-4 bg-white shadow-md">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-2 text-lg"
          placeholder="Search for an item..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Grocery Items List */}
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="p-4">
          {filteredItems.length === 0 ? (
            <Text className="text-center text-gray-500 mt-8">No items match your search. Try another query!</Text>
          ) : (
            filteredItems.map((item) => (
              <GroceryItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                image={item.image_url}
                expiryDate={new Date(item.expiry_date)}
                keywords={item.keywords}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Scan Button - Enhanced to work with tab bar */}
      <View className="absolute bottom-24 right-8 z-10">
        <TouchableOpacity
          className="w-16 h-16 rounded-full bg-green-600 justify-center items-center shadow-xl"
          onPress={() => router.push("/scan")}
          style={{
            elevation: 12, // Higher elevation than tab bar
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="scan" color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
