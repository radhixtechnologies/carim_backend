import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#f5f5f5",
        color: "#666",
        textAlign: "center",
        fontSize: "14px",
      }}
    >
      <span>
        Copyright © 2025 Designed by{" "}
        <Link
          to="/dashboard"
          rel="nofollow noopener noreferrer"
          title="Carim"
          style={{ textDecoration: "none", color: "#0878fe" }}
        >
          Carim
        </Link>
        . All rights reserved.
      </span>
    </footer>
  );
};

export default Footer;
