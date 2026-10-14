import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
  Theme,
} from "@mui/material";

export type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  toggleTheme: () => {},
  isDark: true,
});

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Currently considered as dark mode by default
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem("si_theme_mode");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return "dark";
  });

  useEffect(() => {
    try {
      localStorage.setItem("si_theme_mode", mode);
    } catch (e) {
      // ignore
    }
    document.documentElement.setAttribute("data-theme", mode);
    if (mode === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const muiTheme: Theme = useMemo(() => {
    const isDarkMode = mode === "dark";
    return createTheme({
      palette: {
        mode,
        primary: {
          main: isDarkMode ? "#00fffc" : "#0284c7",
          contrastText: isDarkMode ? "#001a1c" : "#ffffff",
        },
        background: {
          default: isDarkMode ? "#05101c" : "#e8eff8",
          paper: isDarkMode ? "#111d27" : "#ffffff",
        },
        text: {
          primary: isDarkMode ? "#ffffff" : "#0f172a",
          secondary: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "#475569",
        },
      },
      typography: {
        fontFamily: "Roboto Slab, serif",
        allVariants: {
          color: isDarkMode ? "#ffffff" : "#0f172a",
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: "none",
              borderRadius: "10px",
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{ mode, toggleTheme, isDark: mode === "dark" }}
    >
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
