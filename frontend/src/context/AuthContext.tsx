import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  checkAuthStatus,
  loginUser,
  logoutUser,
  signupUser,
} from "../helpers/api-communicator";

type User = {
  name: string;
  email: string;
};

type UserAuth = {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    confirmPassword?: string
  ) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<UserAuth | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Instant hydration from local cache prevents blank screens on reload
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("si_user_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("si_auth_active") === "true";
    } catch {
      return false;
    }
  });

  // If user never logged in or explicitly logged out, isLoading is false immediately
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return localStorage.getItem("si_auth_active") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const data = await checkAuthStatus();
        if (data && isMounted) {
          const userData = { email: data.email, name: data.name };
          setUser(userData);
          setIsLoggedIn(true);
          try {
            localStorage.setItem("si_auth_active", "true");
            localStorage.setItem("si_user_data", JSON.stringify(userData));
          } catch (_) {}
        }
      } catch (err) {
        if (isMounted) {
          setIsLoggedIn(false);
          setUser(null);
          try {
            localStorage.removeItem("si_auth_active");
            localStorage.removeItem("si_user_data");
          } catch (_) {}
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    confirmPassword?: string
  ) => {
    const data = await loginUser(email, password, confirmPassword);
    if (data) {
      const userData = { email: data.email, name: data.name };
      setUser(userData);
      setIsLoggedIn(true);
      try {
        localStorage.setItem("si_auth_active", "true");
        localStorage.setItem("si_user_data", JSON.stringify(userData));
      } catch (_) {}
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ) => {
    const data = await signupUser(name, email, password, confirmPassword);
    if (data) {
      const userData = { email: data.email, name: data.name };
      setUser(userData);
      setIsLoggedIn(true);
      try {
        localStorage.setItem("si_auth_active", "true");
        localStorage.setItem("si_user_data", JSON.stringify(userData));
      } catch (_) {}
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("si_auth_active");
      localStorage.removeItem("si_user_data");
      await logoutUser();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      window.location.href = "/";
    }
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
