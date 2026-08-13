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
    const handleAuth = async (session) => {
      if (session?.user) {
        setUser(session.user);
        let { data: profileData } = await supabase
          .from("users")
          .select("*, organization:organizations(*)")
          .eq("id", session.user.id)
          .single();
        
        setProfile(profileData);
        
        if (profileData?.organization) {
          setOrganization(profileData.organization);
        } else {
          // AUTO-CREATE FALLBACK: If user somehow skipped org creation
          try {
             console.log("Running organization fallback creation...");
             const orgName = `${session.user.user_metadata?.full_name || 'My'} Organization`;
             const { data: orgData, error: orgError } = await supabase
               .from('organizations')
               .insert({ name: orgName })
               .select()
               .single();
               
             if (orgError) {
               console.error("Supabase Org Insert Error:", orgError);
               throw orgError;
             }
               
             if (orgData) {
               const { error: userError } = await supabase
                 .from('users')
                 .update({ organization_id: orgData.id })
                 .eq('id', session.user.id);
                 
               if (userError) {
                 console.error("Supabase User Update Error:", userError);
                 throw userError;
               }
                 
               // Fetch profile again now that they can read their own row!
               const { data: fixedProfile } = await supabase
                 .from("users")
                 .select("*, organization:organizations(*)")
                 .eq("id", session.user.id)
                 .single();

               setOrganization(orgData);
               setProfile(fixedProfile);
               console.log("Fallback organization created successfully!");
             }
          } catch(e) {
             console.error('Fallback org creation failed', e);
             alert("We tried to auto-fix your organization but it failed: " + e.message);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setOrganization(null);
      }
      setLoading(false);
    };

    // Check active sessions and sets the user
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await handleAuth(session);
    };
    init();

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleAuth(session);
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

    // Get current user directly from session to avoid race conditions with React state
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || user;

    // Then update the user's profile to link to this organization
    if (currentUser) {
      const { error: userError } = await supabase
        .from("users")
        .update({ organization_id: orgData.id })
        .eq("id", currentUser.id);

      if (userError) throw new Error(userError.message);

      // Refresh profile
      const { data: profileData } = await supabase
        .from("users")
        .select("*, organization:organizations(*)")
        .eq("id", currentUser.id)
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
