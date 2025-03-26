// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { logout as logoutService } from '../services/auth';
import { clearSession, getSession, setSession } from '../utils/storage';

interface User {
  _type: string;
  id: string;
  dataType: string;
  presentation: string;
  navigationRef: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const session = getSession();
    return session?.user || null;
  });

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      const sessionData = getSession() || {};
      setSession({ ...sessionData, user: newUser });
    } else {
      clearSession();
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await logoutService(user);
      }
      setUser(null);
      clearSession();
    } catch (error) {
      console.error('Logout error in context:', error);
      setUser(null);
      clearSession();
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}