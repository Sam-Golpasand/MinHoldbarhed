// app/_layout.tsx
import { Stack } from "expo-router"

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false,}} />
    </Stack>
  )
}