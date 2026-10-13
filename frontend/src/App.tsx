import Header from "./components/Header";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";

function App() {
  const auth = useAuth();

  if (auth?.isLoading) {
    return (
      <main
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#05101c",
        }}
      >
        <img
          src="/si-logo.png"
          alt="Loading"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            filter: "drop-shadow(0 0 20px rgba(0, 255, 252, 0.6))",
            animation: "rotation 3s infinite linear",
          }}
        />
      </main>
    );
  }

  return (
    <main>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            auth?.isLoggedIn && auth.user ? (
              <Navigate to="/chat" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/signup"
          element={
            auth?.isLoggedIn && auth.user ? (
              <Navigate to="/chat" replace />
            ) : (
              <Signup />
            )
          }
        />
        <Route
          path="/chat"
          element={
            auth?.isLoggedIn && auth.user ? (
              <Chat />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default App;
