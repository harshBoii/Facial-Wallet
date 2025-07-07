"use client";
import React, { useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setMessage("OTP sent to your email. Please check your inbox.");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");
      setMessage("Login successful! Redirecting...");
      // Optionally redirect to dashboard or home
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          padding: "2.5rem 2rem",
          borderRadius: 16,
          boxShadow: "0 6px 32px rgba(60, 72, 88, 0.15)",
          background: "#fff",
          border: "1px solid #e3e8ee",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 28,
            fontWeight: 700,
            fontSize: 26,
            color: "#223354",
            letterSpacing: 0.5,
          }}
        >
          Login with Email OTP
        </h2>
        {step === "email" && (
          <form onSubmit={handleRequestOtp}>
            <label
              style={{
                display: "block",
                marginBottom: 12,
                fontWeight: 500,
                color: "#223354",
                fontSize: 15,
              }}
            >
              Email:
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: 6,
                  marginBottom: 18,
                  border: "1px solid #c3cfe2",
                  borderRadius: 6,
                  fontSize: 16,
                  outline: "none",
                  background: loading ? "#f5f7fa" : "#fff",
                  transition: "border 0.2s",
                }}
                disabled={loading}
              />
            </label>
            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: "100%",
                padding: "12px 0",
                background: loading || !email ? "#c3cfe2" : "linear-gradient(90deg, #4f8cff 0%, #2355d6 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                border: "none",
                borderRadius: 6,
                cursor: loading || !email ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(60, 72, 88, 0.07)",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <label
              style={{
                display: "block",
                marginBottom: 12,
                fontWeight: 500,
                color: "#223354",
                fontSize: 15,
              }}
            >
              Enter OTP sent to <b>{email}</b>:
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: 6,
                  marginBottom: 18,
                  border: "1px solid #c3cfe2",
                  borderRadius: 6,
                  fontSize: 20,
                  letterSpacing: 6,
                  textAlign: "center",
                  outline: "none",
                  background: loading ? "#f5f7fa" : "#fff",
                  transition: "border 0.2s",
                }}
                disabled={loading}
                maxLength={6}
              />
            </label>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                width: "100%",
                padding: "12px 0",
                background: loading || otp.length !== 6 ? "#c3cfe2" : "linear-gradient(90deg, #4f8cff 0%, #2355d6 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                border: "none",
                borderRadius: 6,
                cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(60, 72, 88, 0.07)",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              style={{
                width: "100%",
                marginTop: 10,
                background: "#f5f7fa",
                color: "#223354",
                fontWeight: 500,
                fontSize: 15,
                border: "1px solid #e3e8ee",
                borderRadius: 6,
                padding: "10px 0",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
              disabled={loading}
            >
              Change Email
            </button>
          </form>
        )}
        {message && (
          <div
            style={{
              color: "#1a7f37",
              background: "#e6f9ed",
              border: "1px solid #b7ebd1",
              borderRadius: 6,
              padding: "10px 14px",
              marginTop: 20,
              fontWeight: 500,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              color: "#d7263d",
              background: "#fff0f3",
              border: "1px solid #ffd6db",
              borderRadius: 6,
              padding: "10px 14px",
              marginTop: 20,
              fontWeight: 500,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 