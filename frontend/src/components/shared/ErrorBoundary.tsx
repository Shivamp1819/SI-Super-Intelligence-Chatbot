import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";
import { FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            bgcolor: "#05101c",
            color: "white",
            p: 3,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: "rgb(17, 29, 39)",
              border: "1px solid rgba(0, 255, 252, 0.25)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
              maxWidth: "460px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "rgba(255, 82, 82, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ff5252",
              }}
            >
              <FiAlertTriangle size={28} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
              Something went wrong
            </Typography>

            <Typography
              sx={{
                fontSize: "13.5px",
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.5,
              }}
            >
              The system encountered an unexpected condition. Don't worry, your
              data is safe. Click below to recover smoothly.
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, mt: 1, width: "100%" }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={this.handleGoHome}
                sx={{
                  color: "#00fffc",
                  borderColor: "rgba(0, 255, 252, 0.4)",
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1,
                  ":hover": {
                    borderColor: "#00fffc",
                    bgcolor: "rgba(0, 255, 252, 0.08)",
                  },
                }}
              >
                Go Home
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={this.handleReload}
                startIcon={<FiRefreshCw size={14} />}
                sx={{
                  bgcolor: "#00fffc",
                  color: "#001a1c",
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1,
                  ":hover": {
                    bgcolor: "white",
                  },
                }}
              >
                Reload App
              </Button>
            </Box>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
