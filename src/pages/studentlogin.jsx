import React, { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { loginStudent } from "../api/auth";
import schoolLogo from "../assets/logo.jpeg";

export default function StudentLogin() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await loginStudent({ admissionNumber, password });
      window.location.href = "/student/dashboard";
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Invalid admission number or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const pageStyles = {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Quicksand', sans-serif"
  };

  const cardStyles = {
    width: "100%",
    maxWidth: "460px",
    background: "#fff",
    borderRadius: "18px",
    padding: "38px",
    boxShadow: "0 15px 45px rgba(11, 37, 69, 0.10)",
    border: "1px solid #e2e8f0"
  };

  const inputStyles = {
    width: "100%",
    padding: "14px 15px",
    border: "1px solid #dbe2ea",
    borderRadius: "9px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
    color: "#0f172a"
  };

  return (
    <div style={pageStyles}>
      <header
        style={{
          background: "#0b2545",
          padding: "16px 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px"
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#fff",
            textDecoration: "none",
            fontWeight: "700",
            fontSize: "18px"
          }}
        >
          <img
            src={schoolLogo}
            alt="O'lak Triumph School"
            style={{
              width: "45px",
              height: "45px",
              objectFit: "contain",
              borderRadius: "50%"
            }}
          />
          <span>O'lak Triumph School</span>
        </a>

        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            color: "#fff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          <ArrowLeft size={17} />
          Back to Home
        </a>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "45px 20px"
        }}
      >
        <div style={cardStyles}>
          <div
            style={{
              width: "90px",
              height: "90px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#fff",
              border: "3px solid #d4af37",
              boxShadow: "0 5px 18px rgba(11, 37, 69, 0.12)"
            }}
          >
            <img
              src={schoolLogo}
              alt="O'lak Triumph School Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }}
            />
          </div>

          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <span
              style={{
                color: "#b89528",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "2px"
              }}
            >
              O'LAK TRIUMPH SCHOOL
            </span>

            <h1
              style={{
                color: "#0b2545",
                fontSize: "28px",
                margin: "10px 0",
                fontWeight: "800"
              }}
            >
              Student Login
            </h1>

            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Welcome! Sign in to access your student portal.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="student-admission"
              style={{
                display: "block",
                color: "#0b2545",
                fontWeight: "700",
                fontSize: "14px",
                marginBottom: "9px"
              }}
            >
              Admission Number
            </label>

            <input
              id="student-admission"
              type="text"
              required
              autoComplete="username"
              placeholder="e.g. OTS/2022/014"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              style={{ ...inputStyles, marginBottom: "22px" }}
              disabled={loading}
            />

            <label
              htmlFor="student-password"
              style={{
                display: "block",
                color: "#0b2545",
                fontWeight: "700",
                fontSize: "14px",
                marginBottom: "9px"
              }}
            >
              Password
            </label>

            <div style={{ position: "relative", marginBottom: "20px" }}>
              <input
                id="student-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyles, paddingRight: "48px" }}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex"
                }}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {message && (
              <p
                role="status"
                style={{
                  color: "#b91c1c",
                  background: "#fef2f2",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  marginBottom: "10px"
                }}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                background: loading ? "#64748b" : "#0b2545",
                color: "#fff",
                border: "none",
                borderRadius: "9px",
                fontSize: "15px",
                fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "10px",
                fontFamily: "inherit"
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              marginTop: "25px",
              paddingTop: "20px",
              textAlign: "center"
            }}
          >
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              Are you an administrator?{" "}
              <a
                href="/admin/login"
                style={{
                  color: "#b89528",
                  fontWeight: "800",
                  textDecoration: "none"
                }}
              >
                Admin Login
              </a>
            </p>

            <a
              href="/"
              style={{
                display: "inline-block",
                marginTop: "20px",
                color: "#64748b",
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              Return to school homepage
            </a>
          </div>
        </div>
      </main>

      <footer
        style={{
          background: "#0b2545",
          color: "#fff",
          textAlign: "center",
          padding: "18px",
          fontSize: "12px"
        }}
      >
        © 2003–2026 O'lak Triumph School. All rights reserved.
      </footer>
    </div>
  );
}