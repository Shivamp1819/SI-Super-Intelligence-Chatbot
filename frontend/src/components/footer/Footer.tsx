import React from "react";
import { Link } from "react-router-dom";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";
import { useThemeMode } from "../../context/ThemeContext";

const Footer = () => {
  const { isDark } = useThemeMode();

  return (
    <footer>
      <div className="footer-container">
        <p className="footer-text" style={{ color: isDark ? "white" : "#0f172a" }}>
          Built With Love By{" "}
          <Link
            style={{ color: isDark ? "#00fffc" : "#0284c7", textDecoration: "none", fontWeight: 700 }}
            className="footer-link"
            to={"https://www.youtube.com/@m_rs_p"}
            target="_blank"
            rel="noreferrer"
          >
            Shivam Patel
          </Link>
        </p>

        <div className="footer-social-links">
          <a
            href="https://linkedin.com/in/shivamp1819"
            target="_blank"
            rel="noreferrer"
            className="footer-social-icon"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <FaLinkedin size={20} />
          </a>
          <a
            href="https://www.youtube.com/@m_rs_p"
            target="_blank"
            rel="noreferrer"
            className="footer-social-icon"
            aria-label="YouTube"
            title="YouTube"
          >
            <FaYoutube size={20} />
          </a>
          <a
            href="https://instagram.com/spsidhauli73?rpxt=MWQyaXlxa3ppOWpiZg%3D%3D"
            target="_blank"
            rel="noreferrer"
            className="footer-social-icon"
            aria-label="Instagram"
            title="Instagram"
          >
            <FaInstagram size={20} />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=100015243968968"
            target="_blank"
            rel="noreferrer"
            className="footer-social-icon"
            aria-label="Facebook"
            title="Facebook"
          >
            <FaFacebook size={20} />
          </a>
          <a
            href="mailto:splkobnrs@gmail.com"
            className="footer-social-icon"
            aria-label="Email"
            title="Email"
          >
            <FaEnvelope size={19} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
