import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SupabaseContext = createContext();

export function useSupabase() {
  return useContext(SupabaseContext);
}

export function SupabaseProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Load user profile
        const { data: profileData } = await supabase
          .from("users")
          .select("*, organizations(*)")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
        if (profileData?.organizations) {
          setOrganization(profileData.organizations);
        }
      }
      setLoading(false);
    };
    init();

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("users")
          .select("*, organizations(*)")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
        if (profileData?.organizations) {
          setOrganization(profileData.organizations);
        }
      } else {
        setUser(null);
        setProfile(null);
        setOrganization(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, options = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: options },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw new Error(error.message);
  };

  const createOrganization = async (orgName) => {
    // First, we need to create the organization
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError) throw new Error(orgError.message);

    // Then update the user's profile to link to this organization
    if (user) {
      const { error: userError } = await supabase
        .from("users")
        .update({ organization_id: orgData.id })
        .eq("id", user.id);

      if (userError) throw new Error(userError.message);

      // Refresh profile
      const { data: profileData } = await supabase
        .from("users")
        .select("*, organizations(*)")
        .eq("id", user.id)
        .single();
      setProfile(profileData);
      setOrganization(orgData);
    }

    return orgData;
  };

  const value = {
    supabase,
    user,
    profile,
    organization,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createOrganization,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
