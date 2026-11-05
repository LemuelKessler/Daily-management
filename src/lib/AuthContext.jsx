import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Certifique-se de ter seu cliente Supabase exportado em src/lib/supabase.js

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // 1. Obter a sessão atual do Supabase ao carregar a aplicação
    const getInitialSession = async () => {
      try {
        setIsLoadingAuth(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão do Supabase:', error);
        setAuthError(error.message);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    getInitialSession();

    // 2. Escutar mudanças no estado de autenticação (login, logout, token renovado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função de Login (E-mail/Senha)
  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoadingAuth(false);
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    return data;
  };

  // Função de Cadastro
  const signUp = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setIsLoadingAuth(false);
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    return data;
  };

  // Função de Logout
  const logout = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setIsLoadingAuth(false);
    if (error) console.error('Erro ao fazer logout:', error);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      isAuthenticated, 
      isLoadingAuth,
      authError,
      login,
      signUp,
      logout
    }}>
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