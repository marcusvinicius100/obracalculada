import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserType = 'pessoa_fisica' | 'profissional' | 'empresa';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: UserType;
  created_at?: string;
  updated_at?: string;
}

interface SignUpData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  user_type: UserType;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (data: SignUpData & { password: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or construct profile from auth.users or profiles table
  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
      } else {
        // Fallback to user metadata if profiles table is empty or trigger didn't run
        const meta = currentUser.user_metadata || {};
        const fallbackProfile: UserProfile = {
          id: currentUser.id,
          name: meta.name || meta.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          email: currentUser.email || '',
          phone: meta.phone || '',
          user_type: (meta.user_type as UserType) || 'pessoa_fisica',
        };
        setProfile(fallbackProfile);
      }
    } catch {
      const meta = currentUser.user_metadata || {};
      setProfile({
        id: currentUser.id,
        name: meta.name || currentUser.email?.split('@')[0] || 'Usuário',
        email: currentUser.email || '',
        phone: meta.phone || '',
        user_type: (meta.user_type as UserType) || 'pessoa_fisica',
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ name, email, phone, password, user_type }: SignUpData & { password: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            user_type,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        // Try to insert in public.profiles table if exists
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name,
            email,
            phone: phone || null,
            user_type,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Upsert profile notice:', e);
        }

        await fetchProfile(data.user);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      if (data.user) {
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Usuário não autenticado') };
    try {
      // Update metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: updates.name ?? profile?.name,
          phone: updates.phone ?? profile?.phone,
          user_type: updates.user_type ?? profile?.user_type,
        },
      });

      if (authError) return { error: authError };

      // Update in profiles table if available
      try {
        await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (e) {
        console.warn('Could not update profile table:', e);
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error('Usuário não autenticado') };
    try {
      // Delete user data in database tables
      await supabase.from('shopping_list_items').delete().eq('user_id', user.id);
      await supabase.from('calculations').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('projects').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Sign out
      await signOut();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
