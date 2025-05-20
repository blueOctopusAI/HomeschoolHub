"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import type { User } from "@supabase/supabase-js"; // Ensure this import is present

export function AuthListener() {
  const supabase = createSupabaseBrowserClient();
  const setAuthUser = useStore((state) => state.setAuthUser);
  const setIsAuthLoading = useStore((state) => state.setIsAuthLoading);
  const currentAuthUserInStore = useStore((state) => state.authUser); // For comparison

  useEffect(() => {
    const getInitialSession = async () => {
      setIsAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (!currentAuthUserInStore || currentAuthUserInStore.id !== session.user.id) {
          setAuthUser(session.user as User);
        }
      } else {
        if (currentAuthUserInStore !== null) {
          setAuthUser(null);
        }
      }
      setIsAuthLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // console.log("Auth event:", _event, session); // Optional: for debugging
        const newAuthUser = session?.user ?? null;
        if (
          (newAuthUser === null && currentAuthUserInStore !== null) ||
          (newAuthUser !== null && (!currentAuthUserInStore || currentAuthUserInStore.id !== newAuthUser.id))
        ) {
          setAuthUser(newAuthUser as User | null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  // Add currentAuthUserInStore to dependencies.
  // supabase, setAuthUser, setIsAuthLoading are generally stable if from Zustand/fixed instance.
  }, [supabase, setAuthUser, setIsAuthLoading, currentAuthUserInStore]);

  return null; // This component does not render UI
}
