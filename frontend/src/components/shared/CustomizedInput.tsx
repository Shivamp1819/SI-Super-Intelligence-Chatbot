import React from "react";
import TextField from "@mui/material/TextField";
import { InputAdornment } from "@mui/material";

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
  return (
    <TextField
      margin="dense"
      InputLabelProps={{
        style: { color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" },
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
          color: "white",
          height: "46px",
          backgroundColor: "rgb(17, 29, 39)",
        },
      }}
      sx={{
        my: 0.8,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "rgb(17, 29, 39)",
          borderRadius: "10px",
          paddingRight: endAdornment ? "8px" : "14px",
          "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&:hover fieldset": {
            borderColor: "#00fffc",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#00fffc",
          },
        },
        "& .MuiInputBase-input": {
          padding: "11px 14px",
          fontSize: "16px",
          color: "white !important",
          "&:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            boxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            WebkitTextFillColor: "#ffffff !important",
            caretColor: "#00fffc !important",
            transition: "background-color 50000s ease-in-out 0s",
            borderRadius: "8px",
          },
          "&:-webkit-autofill:hover": {
            WebkitBoxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            boxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            WebkitTextFillColor: "#ffffff !important",
          },
          "&:-webkit-autofill:focus": {
            WebkitBoxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            boxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            WebkitTextFillColor: "#ffffff !important",
          },
          "&:-webkit-autofill:active": {
            WebkitBoxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            boxShadow: "0 0 0 1000px rgb(17, 29, 39) inset !important",
            WebkitTextFillColor: "#ffffff !important",
          },
        },
      }}
    />
  );
};

export default CustomizedInput;
