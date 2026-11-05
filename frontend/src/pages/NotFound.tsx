import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { useThemeMode } from "../context/ThemeContext";

const NotFound = () => {
  const { isDark } = useThemeMode();

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
        py: 4,
        boxSizing: "border-box",
        bgcolor: isDark ? "transparent" : "#e8eff8",
      }}
    >
      <Box
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          bgcolor: isDark ? "rgb(17, 29, 39)" : "#ffffff",
          border: isDark
            ? "1px solid rgba(0, 255, 252, 0.2)"
            : "1px solid rgba(2, 132, 199, 0.2)",
          boxShadow: isDark
            ? "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 252, 0.15)"
            : "0 10px 40px rgba(15, 23, 42, 0.08), 0 0 30px rgba(2, 132, 199, 0.1)",
          maxWidth: "480px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "80px", sm: "110px" },
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 4,
            background: isDark
              ? "linear-gradient(135deg, #00fffc 0%, #a855f7 100%)"
              : "linear-gradient(135deg, #0284c7 0%, #9333ea 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: isDark
              ? "drop-shadow(0 0 25px rgba(0, 255, 252, 0.4))"
              : "none",
            mb: 1,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: isDark ? "#ffffff" : "#0f172a",
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: "20px", sm: "24px" },
          }}
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255, 255, 255, 0.65)" : "#64748b",
            mb: 3,
            maxWidth: "360px",
            lineHeight: 1.6,
          }}
        >
          The page you are looking for might have been moved, deleted, or does not exist.
        </Typography>

        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<FiHome size={18} />}
          sx={{
            bgcolor: isDark ? "#00fffc" : "#0284c7",
            color: isDark ? "#001a1c" : "#ffffff",
            fontWeight: 700,
            fontSize: "14px",
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            py: 1.2,
            boxShadow: isDark
              ? "0 4px 16px rgba(0, 255, 252, 0.3)"
              : "0 4px 16px rgba(2, 132, 199, 0.3)",
            transition: "all 0.25s ease",
            ":hover": {
              bgcolor: isDark ? "#ffffff" : "#0369a1",
              color: isDark ? "#000000" : "#ffffff",
              boxShadow: isDark
                ? "0 6px 22px rgba(0, 255, 252, 0.5)"
                : "0 6px 22px rgba(2, 132, 199, 0.4)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Back To Home
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;
