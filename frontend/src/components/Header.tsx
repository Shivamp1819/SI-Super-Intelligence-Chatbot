import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Logo from "./shared/Logo";
import { useAuth } from "../context/AuthContext";
import NavigationLink from "./shared/NavigationLink";

const Header = () => {
  const auth = useAuth();
  return (
    <AppBar
      sx={{ bgcolor: "transparent", position: "static", boxShadow: "none" }}
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {auth?.isLoggedIn ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.8, sm: 1.2 },
              }}
            >
              <NavigationLink
                bg="#00fffc"
                to="/chat"
                text="Go To Chat"
                textColor="black"
                fontSize="12px"
                padding="5px 12px"
              />
              {/* Logout button placed on the top right-most side of the page */}
              <NavigationLink
                bg="#51538f"
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
                bg="#00fffc"
                to="/login"
                text="Login"
                textColor="black"
                fontSize="12px"
                padding="5px 12px"
              />
              <NavigationLink
                bg="#51538f"
                textColor="white"
                to="/signup"
                text="Signup"
                fontSize="12px"
                padding="5px 12px"
              />
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
