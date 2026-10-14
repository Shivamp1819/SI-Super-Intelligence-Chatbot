import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useThemeMode } from "../../context/ThemeContext";

const Logo = () => {
  const { isDark } = useThemeMode();

  return (
    <div
      style={{
        display: "flex",
        marginRight: "auto",
        alignItems: "center",
      }}
    >
      <Link
        to={"/"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
        }}
      >
        <img
          src="/si-logo.png"
          alt="SI Super Intelligence Logo"
          width={"34px"}
          height={"34px"}
          style={{
            borderRadius: "50%",
            filter: isDark
              ? "drop-shadow(0 0 8px rgba(0, 255, 252, 0.45))"
              : "drop-shadow(0 2px 8px rgba(2, 132, 199, 0.35))",
            transition: "transform 0.25s ease, filter 0.25s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.filter = isDark
              ? "drop-shadow(0 0 14px rgba(0, 255, 252, 0.75))"
              : "drop-shadow(0 4px 14px rgba(2, 132, 199, 0.6))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.filter = isDark
              ? "drop-shadow(0 0 8px rgba(0, 255, 252, 0.45))"
              : "drop-shadow(0 2px 8px rgba(2, 132, 199, 0.35))";
          }}
        />
        <Typography
          sx={{
            fontWeight: "800",
            letterSpacing: "0.5px",
            textShadow: isDark ? "0 2px 14px rgba(0, 0, 0, 0.7)" : "none",
            fontSize: { xs: "16px", sm: "18px", md: "19px" },
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              color: isDark ? "#00fffc" : "#0284c7",
              fontWeight: 900,
              transition: "color 0.3s ease",
            }}
          >
            SI
          </span>
          <Box
            component="span"
            sx={{
              display: { xs: "none", sm: "inline" },
              ml: 0.8,
              color: isDark ? "white" : "#0f172a",
              transition: "color 0.3s ease",
            }}
          >
            Super Intelligence
          </Box>
        </Typography>
      </Link>
    </div>
  );
};

export default Logo;

