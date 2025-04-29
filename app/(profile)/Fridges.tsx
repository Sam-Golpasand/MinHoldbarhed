import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput
} from "react-native"
import { supabase } from "../../utils/supabase"
import { useRouter } from "expo-router"


export function Fridges() {
  const [loading, setLoading] = useState(false)
  const [fridgeList, setFridgeList] = useState([]);
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false);


  const [modalVisible, setModalVisible] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState("");

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinFridgeCode, setJoinFridgeCode] = useState("");

  const router = useRouter()

  useEffect(() => {
    fetchFridges()
  }, [])

  async function fetchFridges() {
    setLoading(true)
    setFetchError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("User not authenticated")
      }

      const { data, error } = await supabase
        .from("user_fridge")
        .select("fridges(*)")
        .eq("user_id", user.id)

      if (error) {
        console.error("Error fetching user_fridge:", error)
        setFetchError("Could not fetch your fridges.")
        return
      }
      const fridges = data.map((link) => link.fridges);
      setFridgeList(fridges);
    } catch (error) {
      console.error("Unexpected error fetching fridges:", error)
      Alert.alert("Error", "Something went wrong while fetching your fridges.")
    } finally {
      setLoading(false)
    }
  }

  function generateShareCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  return (
    <View className="bg-white p-6 rounded-xl shadow-sm mb-6">
      <View className="flex-row items-center mb-4">
        <Text className="text-lg font-bold text-gray-800">Fridges</Text>
        {loading && <ActivityIndicator size="small" color="#16a34a" style={{ marginLeft: 10 }} />}
      </View>

      {fetchError && <Text className="text-red-500">{fetchError}</Text>}

      {fridgeList.length === 0 && !loading ? (
        <Text className="text-gray-500">You haven’t added any fridges yet.</Text>
      ) : (
        <ScrollView>
          {fridgeList.map((fridge, index) => (
            <FridgeModule key={fridge.id} name={fridge.name} isLast={index === fridgeList.length - 1} code={fridge.share_code} />
          ))}
        </ScrollView>
      )}
      {/* Add fridge*/}
      <TouchableOpacity
        className="mt-4 bg-green-600 py-3 px-4 rounded-lg items-center"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white font-semibold">New Fridge</Text>
      </TouchableOpacity>
      {/* Join Fridge */}
      <TouchableOpacity
        className="mt-4 bg-white border-green-600 border-2 py-3 px-4 rounded-lg items-center"
        onPress={() => setJoinModalVisible(true)}
      >
        <Text className="text-green-600 font-semibold">Join Fridge</Text>
      </TouchableOpacity>
      {/* New Fridge Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
          <View className="bg-white p-6 rounded-xl w-full">
            <Text className="text-lg font-bold mb-4 text-gray-800">Add a New Fridge</Text>
            
            <TextInput
              placeholder="Fridge name"
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              value={newFridgeName}
              onChangeText={setNewFridgeName}
            />

            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                className="px-4 py-2 bg-gray-300 rounded-lg"
                onPress={() => {
                  setModalVisible(false);
                  setNewFridgeName("");
                }}
              >
                <Text className="text-gray-800">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-2 bg-green-600 rounded-lg"
                onPress={async () => {
                  if (!newFridgeName.trim()) return Alert.alert("Please enter a name");
                  setSaving(true);
                  const { data: { user } } = await supabase.auth.getUser();
                  
                  // Insert new fridge
                  const { data, error } = await supabase
                    .from("fridges")
                    .insert([{ name: newFridgeName, share_code: generateShareCode() }])
                    .select();

                  if (error) {
                    console.error(error);
                    Alert.alert("Error", "Could not add fridge");
                    setSaving(false);
                    return;
                  }

                  // Link fridge to user
                  const fridge = data[0];
                  await supabase
                    .from("user_fridge")
                    .insert([{ user_id: user.id, fridge_id: fridge.id}]);

                  setModalVisible(false);
                  setNewFridgeName("");
                  setSaving(false);
                  fetchFridges(); // refresh list
                }}
              >
                <Text className="text-white font-semibold">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* New Fridge Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={joinModalVisible}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
          <View className="bg-white p-6 rounded-xl w-full">
            <Text className="text-lg font-bold mb-4 text-gray-800">Join a Fridge</Text>

            <TextInput
              placeholder="Enter fridge code"
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              value={joinFridgeCode}
              onChangeText={setJoinFridgeCode}
              autoCapitalize="characters"
            />

            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                className="px-4 py-2 bg-gray-300 rounded-lg"
                onPress={() => {
                  setJoinModalVisible(false);
                  setJoinFridgeCode("");
                }}
              >
                <Text className="text-gray-800">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-2 bg-green-600 rounded-lg"
                onPress={async () => {
                  if (!joinFridgeCode.trim()) return Alert.alert("Please enter a code");

                  try {
                    setSaving(true);

                    // Fetch fridge by share_code
                    const { data: fridgeData, error: fridgeError } = await supabase
                      .from("fridges")
                      .select("*")
                      .eq("share_code", joinFridgeCode.trim().toUpperCase())
                      .single();

                    if (fridgeError || !fridgeData) {
                      Alert.alert("Error", "Fridge not found with this code.");
                      return;
                    }

                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError || !user) throw new Error("User not found");

                    // Link user to fridge
                    const { error: linkError } = await supabase
                      .from("user_fridge")
                      .insert([{ user_id: user.id, fridge_id: fridgeData.id }]);

                    if (linkError) throw linkError;

                    setJoinModalVisible(false);
                    setJoinFridgeCode("");
                    fetchFridges(); // Refresh the fridge list
                  } catch (err) {
                    console.error(err);
                    Alert.alert("Error", "Something went wrong while joining the fridge.");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Text className="text-white font-semibold">Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function FridgeModule({ name, isLast, code }: { name: string; isLast: boolean, code: string }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <TouchableOpacity className={`py-4 ${!isLast ? 'border-b border-gray-200' : ''} flex-row`} onPress={() => setShowCode(!showCode)}>
      <Text className="text-gray-700">{name}</Text>
      <View className="ml-auto flex-row items-center">
        <Text className="text-gray-700 ml-auto">code: </Text>
        <Text className="text-gray-700 ml-auto" >{ showCode ? code : "******"}</Text>
      </View>
      
    </TouchableOpacity>
  )
}
