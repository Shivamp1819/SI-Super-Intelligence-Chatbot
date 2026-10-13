import { Box } from "@mui/material";
import React from "react";
import TypingAnim from "../components/typer/TypingAnim";
import Footer from "../components/footer/Footer";

const Home = () => {
  return (
    <Box width={"100%"} height={"100%"}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          mx: "auto",
          mt: 3,
        }}
      >
        <Box>
          <TypingAnim />
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: { md: "row", xs: "column", sm: "column" },
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 3, sm: 4, md: 6 },
            my: { xs: 4, sm: 6, md: 8 },
            px: 2,
          }}
        >
          <Box
            component="img"
            src="robot.png"
            alt="robot"
            sx={{
              width: { xs: "150px", sm: "180px", md: "200px" },
              height: "auto",
              margin: "auto",
            }}
          />
          <Box
            component="img"
            src="si-logo.png"
            alt="SI Super Intelligence Logo"
            className="rotate"
            sx={{
              width: { xs: "150px", sm: "180px", md: "210px" },
              height: { xs: "150px", sm: "180px", md: "210px" },
              margin: "auto",
              borderRadius: "50%",
              filter: "drop-shadow(0 0 30px rgba(0, 255, 252, 0.45))",
            }}
          />
        </Box>
        <Box sx={{ display: "flex", mx: "auto", width: "100%", justifyContent: "center", px: { xs: 1.5, sm: 3 } }}>
          <Box
            component="img"
            src="chat.png"
            alt="chatbot"
            sx={{
              display: "flex",
              margin: "auto",
              width: { xs: "95%", sm: "85%", md: "60%" },
              maxWidth: "900px",
              borderRadius: { xs: 3, md: 5 },
              boxShadow: "-5px -5px 105px #64f3d5",
              mt: { xs: 2, md: 3 },
              mb: { xs: 3, md: 4 },
              p: { xs: 0.5, md: 1.2 },
            }}
          />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Home;
