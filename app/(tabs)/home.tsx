"use client"

import { useEffect, useState, useCallback } from "react"
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput, Modal } from "react-native"
import { router, useNavigation } from "expo-router"
import GroceryItemCard from "../components/GroceryItemCard"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../utils/supabase"

export default function Home() {
  //fridge dropdown
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedFridge, setSelectedFridge] = useState(null);
  const [fridgeList, setFridgeList] = useState([]);


  const [groceryItems, setGroceryItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigation = useNavigation()

  const fetchFridges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("user_fridge")
      .select("fridges(*)")
      .eq("user_id", user.id);

    if (!error) {
      const fridges = data.map((link) => link.fridges);
      setFridgeList(fridges);
    }
  }

  const fetchGroceryItems = useCallback(async () => {
    try {
      if (!selectedFridge.id) {
        Alert.alert("Error", "Fridge ID is missing.")
        return
      }
  
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .gt("expiry_date", new Date().toISOString())
        .order("expiry_date", { ascending: true })
        .eq("fridge_id", selectedFridge.id)
  
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
  }, [selectedFridge])

  //updates selected fridge to 1st fridge in fridgeList
  
  useFocusEffect(
    useCallback(() => {
      fetchFridges();
    }, [])
  );
  
  useEffect(() => {
    if (fridgeList.length > 0 && (!selectedFridge || !selectedFridge.id)) {
      setSelectedFridge(fridgeList[0]);
    }
  }, [fridgeList, selectedFridge]);

  useEffect(() => {

    if (!selectedFridge) {
      console.log("No fridge selected");
      return
    }

    fetchGroceryItems()

    //sets the current fridge

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
  }, [fetchGroceryItems, navigation, selectedFridge])



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


  const handleDelete = useCallback(
    async (itemId) => {
      try {
        const { error } = await supabase.from("grocery_items").delete().eq("id", itemId)

        if (error) {
          throw error
        }
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
        <View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Fridge-Dropdown */}
          <TouchableOpacity
            onPress={() => setDropdownVisible(true)}
            className="w-1/3 px-3 py-2 border-r border-gray-300 bg-white flex-row items-center justify-between"
          >
            <Text className="text-gray-700 flex-shrink">
              {selectedFridge ? selectedFridge.name : "---"}
            </Text>
            <Ionicons name="chevron-down" className="" size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* Search Input */}
          <TextInput
            className="flex-1 px-4 py-2 text-lg bg-white"
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Fridge-Dropdown Modal */}
        <Modal transparent visible={dropdownVisible} animationType="fade">
          <TouchableOpacity
            className="flex-1 justify-center items-center bg-black/30 px-8"
            activeOpacity={1}
            onPressOut={() => setDropdownVisible(false)}
          >
            <View className="bg-white rounded-xl p-4 w-full max-h-[300px]">
              <ScrollView>
                {fridgeList.map((fridge, index) => (
                  <TouchableOpacity
                    key={fridge.id}
                    className={`py-2 border-b border-gray-100 ${index === fridgeList.length - 1 ? 'border-b-0' : ''}`}
                    onPress={() => {
                      setSelectedFridge(fridge);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text className="text-gray-800">{fridge.name || "---"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* Grocery Items List */}
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="p-4 mb-16">
          {filteredItems.length === 0 ? (
            <Text className="text-center text-gray-500 mt-8">Try another query or switch fridge!</Text>
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
          onPress={() => {
            if (!selectedFridge) {
              Alert.alert("Please select a fridge first.");
              return;
            }
            router.push({
              pathname: "/scan", 
              params: { fridge_id: selectedFridge.id }
            })
          }}
          style={{
            elevation: 12, // Higher elevation than tab bar
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            opacity: selectedFridge ? 1 : 0.5,
          }}
        >
          <Ionicons name="scan" color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
