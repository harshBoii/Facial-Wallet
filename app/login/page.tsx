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
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 24, border: "1px solid #eee", borderRadius: 8, background: "#fff" }}>
      <h2 style={{ textAlign: "center" }}>Login with Email OTP</h2>
      {step === "email" && (
        <form onSubmit={handleRequestOtp}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Email:
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 16 }}
              disabled={loading}
            />
          </label>
          <button type="submit" disabled={loading || !email} style={{ width: "100%", padding: 10 }}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Enter OTP sent to <b>{email}</b>:
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 16, letterSpacing: 4, fontSize: 18, textAlign: "center" }}
              disabled={loading}
              maxLength={6}
            />
          </label>
          <button type="submit" disabled={loading || otp.length !== 6} style={{ width: "100%", padding: 10 }}>
            {loading ? "Verifying..." : "Verify OTP & Login"}
          </button>
          <button type="button" onClick={() => setStep("email") } style={{ width: "100%", marginTop: 8, background: "#eee" }} disabled={loading}>
            Change Email
          </button>
        </form>
      )}
      {message && <div style={{ color: "green", marginTop: 16 }}>{message}</div>}
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
    </div>
  );
} 