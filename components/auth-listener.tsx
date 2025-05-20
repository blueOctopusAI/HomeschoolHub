"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

export function AuthListener() {
  // Get direct actions from the store instead of selectors
  const setAuthUser = useStore((state) => state.setAuthUser);
  const setIsAuthLoading = useStore((state) => state.setIsAuthLoading);
  
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    const getSession = async () => {
      setIsAuthLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        setAuthUser(data.session?.user || null);
      } catch (error) {
        console.error("Auth error:", error);
        setAuthUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    
    // Get initial session
    getSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Simply update the auth user when state changes
        setAuthUser(session?.user || null);
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [setAuthUser, setIsAuthLoading]);
  
  // This component doesn't render anything
  return null;
}
