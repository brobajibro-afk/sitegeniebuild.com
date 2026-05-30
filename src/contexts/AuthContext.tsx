import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { toast } from 'sonner';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
  return data;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  tokenBalance: number;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTokenBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(0);

  const fetchTokenBalance = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('token_balance')
      .eq('id', userId)
      .maybeSingle();
    setTokenBalance(data?.token_balance ?? 0);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    if (profileData) setTokenBalance(profileData.token_balance ?? 0);
  }, [user]);

  const refreshTokenBalance = useCallback(async () => {
    if (!user) return;
    await fetchTokenBalance(user.id);
  }, [user, fetchTokenBalance]);

  useEffect(() => {
    // Timeout fallback: force loading=false after 6s to prevent infinite spinner
    const loadingTimeout = setTimeout(() => setLoading(false), 6000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id).then(p => {
            setProfile(p);
            setTokenBalance(p?.token_balance ?? 0);
          });
        }
      })
      .catch(error => toast.error(`Auth error: ${error.message}`))
      .finally(() => { clearTimeout(loadingTimeout); setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(p => {
          setProfile(p);
          setTokenBalance(p?.token_balance ?? 0);
        });
        // On OAuth callback (Google), ensure profile row exists
        if (event === 'SIGNED_IN' && !session.user.email?.endsWith('@sitegenie.app')) {
          supabase.from('profiles').upsert({
            id: session.user.id,
            username: session.user.user_metadata?.name
              ?? session.user.email?.split('@')[0]
              ?? null,
            email: session.user.email ?? null,
            theme: 'dark',
            editor_font_size: 14,
            editor_color_theme: 'vs-dark',
            token_balance: 0,
          }, { onConflict: 'id', ignoreDuplicates: true });
        }
      } else {
        setProfile(null);
        setTokenBalance(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@sitegenie.app`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@sitegenie.app`;
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username,
          theme: 'dark',
          editor_font_size: 14,
          editor_color_theme: 'vs-dark',
          token_balance: 0,
        }, { onConflict: 'id' });
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/home` },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setTokenBalance(0);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, tokenBalance,
      signInWithUsername, signUpWithUsername, signInWithGoogle,
      signOut, refreshProfile, refreshTokenBalance,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      profile: null,
      loading: false,
      tokenBalance: 0,
      signInWithUsername: async () => ({ error: new Error('No AuthProvider') }),
      signUpWithUsername: async () => ({ error: new Error('No AuthProvider') }),
      signInWithGoogle: async () => ({ error: new Error('No AuthProvider') }),
      signOut: async () => {},
      refreshProfile: async () => {},
      refreshTokenBalance: async () => {},
    } satisfies AuthContextType;
  }
  return context;
}
