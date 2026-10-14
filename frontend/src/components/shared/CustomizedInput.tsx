import React from "react";
import TextField from "@mui/material/TextField";
import { InputAdornment } from "@mui/material";
import { useThemeMode } from "../../context/ThemeContext";

type Props = {
  name: string;
  type: string;
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  endAdornment?: React.ReactNode;
  width?: string;
};

const CustomizedInput = ({
  name,
  type,
  label,
  value,
  onChange,
  disabled,
  required,
  placeholder,
  endAdornment,
  width = "100%",
}: Props) => {
  const { isDark } = useThemeMode();

  return (
    <TextField
      margin="dense"
      InputLabelProps={{
        style: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "#475569",
          fontSize: "14px",
        },
      }}
      name={name}
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      InputProps={{
        endAdornment: endAdornment ? (
          <InputAdornment position="end" sx={{ mr: 0.2 }}>
            {endAdornment}
          </InputAdornment>
        ) : undefined,
        style: {
          width: width || "100%",
          maxWidth: "100%",
          borderRadius: 10,
          fontSize: "16px",
          color: isDark ? "white" : "#0f172a",
          height: "46px",
          backgroundColor: isDark ? "rgb(17, 29, 39)" : "#ffffff",
        },
      }}
      sx={{
        my: 0.8,
        "& .MuiOutlinedInput-root": {
          backgroundColor: isDark ? "rgb(17, 29, 39)" : "#ffffff",
          borderRadius: "10px",
          paddingRight: endAdornment ? "8px" : "14px",
          "& fieldset": {
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(15, 23, 42, 0.18)",
          },
          "&:hover fieldset": {
            borderColor: isDark ? "#00fffc" : "#0284c7",
          },
          "&.Mui-focused fieldset": {
            borderColor: isDark ? "#00fffc" : "#0284c7",
          },
        },
        "& .MuiInputBase-input": {
          padding: "11px 14px",
          fontSize: "16px",
          color: isDark ? "white !important" : "#0f172a !important",
          "&:-webkit-autofill": {
            WebkitBoxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            boxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            WebkitTextFillColor: isDark
              ? "#ffffff !important"
              : "#0f172a !important",
            caretColor: isDark ? "#00fffc !important" : "#0284c7 !important",
            transition: "background-color 50000s ease-in-out 0s",
            borderRadius: "8px",
          },
          "&:-webkit-autofill:hover": {
            WebkitBoxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            boxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            WebkitTextFillColor: isDark
              ? "#ffffff !important"
              : "#0f172a !important",
          },
          "&:-webkit-autofill:focus": {
            WebkitBoxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            boxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            WebkitTextFillColor: isDark
              ? "#ffffff !important"
              : "#0f172a !important",
          },
          "&:-webkit-autofill:active": {
            WebkitBoxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            boxShadow: isDark
              ? "0 0 0 1000px rgb(17, 29, 39) inset !important"
              : "0 0 0 1000px #ffffff inset !important",
            WebkitTextFillColor: isDark
              ? "#ffffff !important"
              : "#0f172a !important",
          },
        },
      }}
    />
  );
};

export default CustomizedInput;

