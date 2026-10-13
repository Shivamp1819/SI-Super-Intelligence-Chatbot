import { TypeAnimation } from "react-type-animation";

const TypingAnim = () => {
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
        color: "white",
        display: "inline-block",
        textShadow: "1px 1px 20px #000",
        fontWeight: 600,
        textAlign: "center",
      }}
      repeat={Infinity}
    />
  );
};

export default TypingAnim;
