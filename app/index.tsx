//app/index.tsx

import { Redirect, router } from "expo-router";
import { supabase } from '../utils/supabase';
import { useEffect, useState } from "react";
import Loading from "./components/Loading";

export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {

    try {
    const { data, error } = await supabase.auth.getUser()


    if (error) {
      console.log('Error fetching user:', error)
    }
    

    if (data?.user?.aud == "authenticated") {
      router.replace('/home')
    } else {
      router.replace('/login')
    }     
  } catch (error) {
      console.error('Error fetching user:', error)
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />; 
  }

  return null
}