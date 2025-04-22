//app/components/GroceryItemCard.tsx
import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

type GroceryItemProps = {
  id: number
  name: string
  image: string
  expiryDate: Date
  keywords: string[]
  onDelete: () => void
}

export default function GroceryItemCard({ id, name, image, expiryDate, keywords, onDelete}: GroceryItemProps) {
  const getExpiryInfo = (expiryDate: Date) => {
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { colorClass: "bg-red-500", text: "Expired" }
    } else if (diffDays === 0) {
      return { colorClass: "bg-red-500", text: "Today" }
    } else if (diffDays <= 2) {
      return { colorClass: "bg-orange-500", text: `${diffDays}d` }
    } else if (diffDays <= 5) {
      return { colorClass: "bg-yellow-500", text: `${diffDays}d` }
    } else {
      return { colorClass: "bg-green-500", text: `${diffDays}d` }
    }
  }

  const handlePress = () => {
    router.push(`/product/${id}`)
  }

  const { colorClass, text } = getExpiryInfo(expiryDate)

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg m-2 shadow-md overflow-hidden"
      onPress={handlePress}
    >
      <View className="flex-row items-center p-3">
        <Image source={{ uri: image }} className="w-16 h-16 rounded-lg mr-3" />
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
          <View className="flex-row flex-wrap">
            {keywords.slice(0, 2).map((keyword, index) => (
              <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1">
                <Text className="text-xs text-gray-600">{keyword}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="items-end">
          <View className={`${colorClass} rounded-full px-2 py-1 mb-2`}>
            <Text className="text-xs font-bold text-white">{text}</Text>
          </View>
          {onDelete === null ? null : (
          <TouchableOpacity 
            className="p-2" 
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#d32f2f" />
          </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}