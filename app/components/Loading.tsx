import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function Loading() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator color="#0000ff" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5fcff',
  },
  text: {
    marginTop: 10,
    fontSize: 18,
    color: '#333333',
  },
})