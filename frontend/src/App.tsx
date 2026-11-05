import React, { lazy, Suspense } from "react";
import Header from "./components/Header";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import { useAuth } from "./context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

// Code-split heavy pages so initial landing page bundle is tiny and loads instantly
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Chat = lazy(() => import("./pages/Chat"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Fast, elegant loading placeholder
const FastPageLoader = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "calc(100vh - 70px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    }}
  >
    <Box
      component="img"
      src="/si-logo.svg"
      alt="Loading"
      sx={{
        width: 44,
        height: 44,
        filter: "drop-shadow(0 0 16px rgba(0, 255, 252, 0.5))",
        animation: "pulseBadge 1.5s infinite ease-in-out",
      }}
    />
    <CircularProgress size={22} sx={{ color: "#00fffc" }} />
  </Box>
);

// Protected Chat Route component with smooth, non-blocking auth resolution
const ProtectedChatRoute = () => {
  const auth = useAuth();

  if (auth?.isLoading) {
    return <FastPageLoader />;
  }

  if (auth?.isLoggedIn && auth.user) {
    return <Chat />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  const auth = useAuth();

  return (
    <main>
      <Header />
      <Suspense fallback={<FastPageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              !auth?.isLoading && auth?.isLoggedIn && auth?.user ? (
                <Navigate to="/chat" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !auth?.isLoading && auth?.isLoggedIn && auth?.user ? (
                <Navigate to="/chat" replace />
              ) : (
                <Signup />
              )
            }
          />
          <Route path="/chat" element={<ProtectedChatRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </main>
  );
}

export default App;

