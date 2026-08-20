import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "../stores/useToastStore";

const SupabaseContext = createContext();

export function useSupabase() {
  return useContext(SupabaseContext);
}

export function SupabaseProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const fallbackTriedRef = useRef(false);

  useEffect(() => {
    const handleAuth = async (session) => {
      if (session?.user) {
        setUser(session.user);
        let { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*, organization:organizations(*)")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Supabase Profile Fetch Error:", profileError);
          setLoading(false);
          return;
        }

        setProfile(profileData || null);

        if (profileData?.organization) {
          setOrganization(profileData.organization);
        } else if (
          !fallbackTriedRef.current &&
          profileData?.id === session.user.id
        ) {
          fallbackTriedRef.current = true;
          const orgName = `${session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "My"} Organization`;
          try {
            let orgId = null;

            // Attempt 1: Plain SQL insert via client (may still fail due to legacy RLS)
            try {
              const tempId = crypto.randomUUID();
              const { error: orgError } = await supabase
                .from("organizations")
                .insert({ id: tempId, name: orgName });

              if (!orgError) {
                orgId = tempId;
              } else {
                console.warn(
                  "org insert attempt 1 failed, trying RPC:",
                  orgError,
                );
              }
            } catch (insertErr) {
              console.warn("org insert attempt 1 error:", insertErr);
            }

            // Attempt 2: SECURITY DEFINER RPC — GUARANTEED to succeed because it
            // runs with postgres privileges and bypasses RLS entirely.
            if (!orgId) {
              const { data: rpcResult, error: rpcError } = await supabase.rpc(
                "bootstrap_create_first_organization",
                {
                  org_name: orgName,
                },
              );

              if (rpcError) {
                console.error(
                  "RPC bootstrap_create_first_organization failed:",
                  rpcError,
                );
                throw rpcError;
              }
              if (!rpcResult) {
                throw new Error("Organization bootstrap RPC returned null");
              }
              orgId = rpcResult;
            }

            // Ensure user is LINKED to org (RPC already does this, but be safe)
            if (orgId) {
              const { error: linkError } = await supabase
                .from("users")
                .update({ organization_id: orgId })
                .eq("id", session.user.id);

              if (linkError && !/duplicate|already/i.test(linkError.message)) {
                throw linkError;
              }
            }

            // Read back the fresh profile (with org join)
            const { data: fixedProfile } = await supabase
              .from("users")
              .select("*, organization:organizations(*)")
              .eq("id", session.user.id)
              .maybeSingle();

            if (fixedProfile) {
              setProfile(fixedProfile);
              if (fixedProfile.organization) {
                setOrganization(fixedProfile.organization);
                toast.success("Organization created — you're all set!");
              }
            } else {
              throw new Error(
                "Profile could not be refreshed after org create",
              );
            }
          } catch (e) {
            console.error("Fallback org creation failed", e);
            toast.error(
              "You don't have an organization yet. Please ask your admin for an invite or create an organization manually.",
              { duration: 10000 },
            );
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
