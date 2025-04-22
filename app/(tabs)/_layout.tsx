import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar, Platform, Dimensions } from "react-native"

const { width } = Dimensions.get("window")
const TAB_BAR_WIDTH = width * 0.97 // 92% of screen width - almost full width
const BOTTOM_SPACING = Platform.OS === "ios" ? 25 : 10 // Space from bottom of screen

export default function TabsLayout() {
  return (
    <>
      <StatusBar backgroundColor="#16a34a" barStyle="light-content" />
      <Tabs
      
        screenOptions={{
          tabBarStyle: {
            position: "absolute",
            bottom: BOTTOM_SPACING,
            left: (width - TAB_BAR_WIDTH) / 2,
            right: (width - TAB_BAR_WIDTH) / 2,
            width: TAB_BAR_WIDTH,
            height: 60,
            marginLeft: 7,
            paddingBottom: 10,
            borderRadius: 12,
            backgroundColor: "#f8f8f8",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 10,
            // Remove custom right padding
            paddingHorizontal: 10,
          },
          tabBarItemStyle: {
            paddingTop: 5,
          },
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#16a34a",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 1,
            },
          },
          tabBarActiveTintColor: "#16a34a", // Match header color for consistency
          tabBarInactiveTintColor: "#8a8a8a",
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            headerTitle: "Home",
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            headerTitle: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  )
}
