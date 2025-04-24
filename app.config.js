import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  scheme: 'acme',
  newArchEnabled: true,
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
        microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#000000',
      },
    ],
    'expo-secure-store',
  ],
  name: 'Min Holdbarhed',
  slug: 'Min-Holdbarhed',
  icon: "./icon.png",
  extra: {
    router: {
      origin: false,
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: '5cc283f3-3e8e-4dbe-9e02-afa83783bd6b',
    },
  },
  android: {
    package: 'com.samgolpasand.MinHoldbarhed',
  },
});
