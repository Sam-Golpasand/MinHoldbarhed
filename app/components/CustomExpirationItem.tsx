import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomExpirationItemProps {
  itemName: string;
  days: any;
  onDelete: () => void;
}

export default function CustomExpirationItem({ itemName, days, onDelete }: CustomExpirationItemProps) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
      <Text className="text-base flex-1">{itemName}</Text>
      <Text className="text-base mr-4">{days} days</Text>
      <TouchableOpacity onPress={onDelete} className="p-1">
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}