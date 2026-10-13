import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";

const NotFound = () => {
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
      }}
    >
      <Box
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          bgcolor: "rgb(17, 29, 39)",
          border: "1px solid rgba(0, 255, 252, 0.2)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 252, 0.15)",
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
            background: "linear-gradient(135deg, #00fffc 0%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 25px rgba(0, 255, 252, 0.4))",
            mb: 1,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: "#ffffff",
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
            color: "rgba(255, 255, 255, 0.65)",
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
            bgcolor: "#00fffc",
            color: "#001a1c",
            fontWeight: 700,
            fontSize: "14px",
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            py: 1.2,
            boxShadow: "0 4px 16px rgba(0, 255, 252, 0.3)",
            transition: "all 0.25s ease",
            ":hover": {
              bgcolor: "#ffffff",
              color: "#000000",
              boxShadow: "0 6px 22px rgba(0, 255, 252, 0.5)",
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
