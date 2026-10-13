import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const Logo = () => {
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
            filter: "drop-shadow(0 0 8px rgba(0, 255, 252, 0.45))",
            transition: "transform 0.25s ease, filter 0.25s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.filter =
              "drop-shadow(0 0 14px rgba(0, 255, 252, 0.75))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.filter =
              "drop-shadow(0 0 8px rgba(0, 255, 252, 0.45))";
          }}
        />
        <Typography
          sx={{
            fontWeight: "800",
            letterSpacing: "0.5px",
            textShadow: "0 2px 14px rgba(0, 0, 0, 0.7)",
            fontSize: { xs: "16px", sm: "18px", md: "19px" },
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "#00fffc", fontWeight: 900 }}>SI</span>
          <Box
            component="span"
            sx={{
              display: { xs: "none", sm: "inline" },
              ml: 0.8,
              color: "white",
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
