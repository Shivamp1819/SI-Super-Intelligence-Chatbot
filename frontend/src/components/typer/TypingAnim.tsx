import { TypeAnimation } from "react-type-animation";
import { useThemeMode } from "../../context/ThemeContext";

const TypingAnim = () => {
  const { isDark } = useThemeMode();

  return (
    <TypeAnimation
      sequence={[
        "Chat With Your OWN AI",
        1000,
        "Powered By Google Gemini 🤖",
        2000,
        "SI Super Intelligence 🧠",
        1500,
      ]}
      speed={50}
      style={{
        fontSize: "32px",
        color: isDark ? "#ffffff" : "#0f172a",
        display: "inline-block",
        textShadow: isDark
          ? "1px 1px 20px rgba(0, 0, 0, 0.9)"
          : "0 2px 14px rgba(2, 132, 199, 0.15)",
        fontWeight: 700,
        textAlign: "center",
        transition: "color 0.3s ease",
      }}
      repeat={Infinity}
    />
  );
};

export default TypingAnim;
