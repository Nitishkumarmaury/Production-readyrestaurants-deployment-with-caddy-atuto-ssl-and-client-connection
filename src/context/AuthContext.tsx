import React, { createContext, useContext, useState, useEffect } from "react";
import { Owner } from "../api/types";
import { destroyCookie, parseCookies } from "nookies";

interface AuthContextType {
  user: Owner | null;
  setUser: (user: Owner | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_profile");
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user profile from localStorage", error);
        localStorage.removeItem("user_profile");
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = (newUser: Owner | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user_profile", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user_profile");
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.clear();
    sessionStorage.clear();
    destroyCookie(null, "cookies_user_access_token", { path: "/" });
    destroyCookie(null, "cookies_user_access_token_temp", { path: "/" });
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
