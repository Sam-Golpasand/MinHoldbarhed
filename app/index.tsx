import { Redirect } from "expo-router";
import { supabase } from '../utils/supabase';
import { useEffect, useState } from "react";
import Loading from "./components/Loading";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      await supabase.auth.signOut();
      // First check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // If we have a session with a user, consider them authenticated
      if (sessionData?.session?.user) {
        console.log("Found existing session");
        setAuthenticated(true);
      } else {
        // If no session, try to get user (this might throw AuthSessionMissingError)
        try {
          const { data } = await supabase.auth.getUser();
          setAuthenticated(!!data?.user);
        } catch (userError) {
          // If we get AuthSessionMissingError, it means there's no session
          console.log("No auth session found:", userError.message);
          setAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading />; 
  }

  // Simplified redirect logic
  return authenticated ? <Redirect href="/fridgeSetUp" /> : <Redirect href="/login" />;
}