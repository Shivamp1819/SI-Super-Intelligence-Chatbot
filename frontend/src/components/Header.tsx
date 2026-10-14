import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Logo from "./shared/Logo";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import NavigationLink from "./shared/NavigationLink";
import { FiSun, FiMoon } from "react-icons/fi";

const Header = () => {
  const auth = useAuth();
  const { isDark, toggleTheme } = useThemeMode();

  return (
    <AppBar
      sx={{
        bgcolor: "transparent",
        position: "static",
        boxShadow: "none",
        borderBottom: isDark
          ? "1px solid rgba(255, 255, 255, 0.05)"
          : "1px solid rgba(15, 23, 42, 0.06)",
        transition: "border-color 0.3s ease",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 1.2, sm: 2, md: 3 },
          minHeight: { xs: "56px", sm: "64px" },
        }}
      >
        <Logo />
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.8, sm: 1.2 } }}>
          {auth?.isLoggedIn ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.8, sm: 1.2 },
              }}
            >
              <NavigationLink
                bg={isDark ? "#00fffc" : "#0284c7"}
                to="/chat"
                text="Go To Chat"
                textColor={isDark ? "#001a1c" : "#ffffff"}
                fontSize="12px"
                padding="5px 12px"
              />
              <NavigationLink
                bg={isDark ? "#51538f" : "#334155"}
                textColor="white"
                to="/"
                text="Logout"
                onClick={auth.logout}
                fontSize="12px"
                padding="5px 12px"
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.6, sm: 1 },
              }}
            >
              <NavigationLink
                bg={isDark ? "#00fffc" : "#0284c7"}
                to="/login"
                text="Login"
                textColor={isDark ? "#001a1c" : "#ffffff"}
                fontSize="12px"
                padding="5px 12px"
              />
              <NavigationLink
                bg={isDark ? "#51538f" : "#334155"}
                textColor="white"
                to="/signup"
                text="Sign Up"
                fontSize="12px"
                padding="5px 12px"
              />
            </Box>
          )}

          {/* Single Short Button for Dark Mode and Light Mode Toggle */}
          <Tooltip
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            placement="bottom"
          >
            <IconButton
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(2, 132, 199, 0.08)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.15)"
                  : "1px solid rgba(2, 132, 199, 0.25)",
                color: isDark ? "#fbbf24" : "#0284c7",
                transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                ":hover": {
                  bgcolor: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(2, 132, 199, 0.18)",
                  borderColor: isDark ? "#fbbf24" : "#0284c7",
                  transform: isDark ? "rotate(25deg) scale(1.06)" : "rotate(-25deg) scale(1.06)",
                  boxShadow: isDark
                    ? "0 0 14px rgba(251, 191, 36, 0.4)"
                    : "0 0 14px rgba(2, 132, 199, 0.35)",
                },
              }}
            >
              {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

