import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Cache admin role check to prevent redundant API calls
  const adminRoleCache = useRef<{ [key: string]: boolean }>({});
  const lastErrorTime = useRef<number>(0);

  // Centralized function to check admin role with caching
  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    // Return cached value if available
    if (adminRoleCache.current[userId] !== undefined) {
      return adminRoleCache.current[userId];
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Only log error once every 10 seconds to avoid spam
        const now = Date.now();
        if (now - lastErrorTime.current > 10000) {
          console.error('Error checking admin role:', error);
          lastErrorTime.current = now;
        }
        return false;
      }

      const isAdminUser = data?.role === 'admin';
      adminRoleCache.current[userId] = isAdminUser;
      return isAdminUser;
    } catch (error) {
      const now = Date.now();
      if (now - lastErrorTime.current > 10000) {
        console.error('Error checking admin role:', error);
        lastErrorTime.current = now;
      }
      return false;
    }
  }, []);

  // Update auth state function
  const updateAuthState = useCallback(async (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      const adminStatus = await checkAdminRole(session.user.id);
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
  }, [checkAdminRole]);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        updateAuthState(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return { user, session, loading, isAdmin, signOut };
}
