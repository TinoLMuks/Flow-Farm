import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      console.log("Email ready for backend reset request:", email);
      setTimeout(() => navigate("/checkemail"), 1500);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          background-color: #0e1628;
          overflow: hidden;
          position: relative;
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: drift 12s ease-in-out infinite alternate;
        }
        .bg-blob-1 {
          width: 500px; height: 500px;
          background: #87aece;
          top: -120px; left: -120px;
          animation-delay: 0s;
        }
        .bg-blob-2 {
          width: 500px; height: 500px;
          background: #afd06e;
          bottom: -120px; right: -80px;
          opacity: 0.28;
          animation-delay: -4s;
        }
        .bg-blob-3 {
          width: 300px; height: 300px;
          background: #407118;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.15;
          animation-delay: -6s;
        }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.08); }
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(175,208,110,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(175,208,110,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .leaf {
          position: absolute;
          pointer-events: none;
          animation: leaf-sway 8s ease-in-out infinite alternate;
        }
        .leaf-1 { top: 8%; right: 10%; opacity: 0.07; animation-delay: 0s; }
        .leaf-2 { bottom: 10%; left: 8%; opacity: 0.06; animation-delay: -3s; transform: rotate(130deg); }

        @keyframes leaf-sway {
          from { transform: rotate(0deg) scale(1); }
          to   { transform: rotate(8deg) scale(1.05); }
        }
        .leaf-2 { animation-name: leaf-sway-2; }
        @keyframes leaf-sway-2 {
          from { transform: rotate(130deg) scale(1); }
          to   { transform: rotate(138deg) scale(1.05); }
        }

        /* Card */
        .fp-card {
          width: 100%;
          max-width: 420px;
          background: rgba(64,113,24,0.06);
          border: 1px solid rgba(175,208,110,0.18);
          border-radius: 24px;
          padding: 48px 44px;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          z-index: 2;
          margin: 24px;
        }

        .fp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #407118 20%, #afd06e 55%, #87aece 80%, transparent);
        }

        .deco-ring {
          position: absolute;
          bottom: -40px; right: -40px;
          width: 140px; height: 140px;
          border-radius: 50%;
          border: 1px solid rgba(175,208,110,0.12);
          pointer-events: none;
        }
        .deco-ring-2 {
          position: absolute;
          bottom: -80px; right: -80px;
          width: 220px; height: 220px;
          border-radius: 50%;
          border: 1px solid rgba(64,113,24,0.1);
          pointer-events: none;
        }

        /* Icon circle */
        .icon-wrap {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: rgba(175,208,110,0.1);
          border: 1px solid rgba(175,208,110,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #afd06e;
        }

        .form-eyebrow {
          font-size: 11px;
          font-weight: 500;
          color: #afd06e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #f0f4ff;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .form-subtitle {
          font-size: 13px;
          color: rgba(240,244,255,0.38);
          line-height: 1.65;
          margin-bottom: 32px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: rgba(240,244,255,0.5);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .field-wrap {
          position: relative;
          margin-bottom: 6px;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.4;
          transition: opacity 0.2s;
          pointer-events: none;
          color: #87aece;
        }
        .field-wrap:focus-within .field-icon { opacity: 1; }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(135,174,206,0.2);
          border-radius: 12px;
          padding: 13px 14px 13px 40px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #f0f4ff;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .field-input::placeholder { color: rgba(240,244,255,0.2); }
        .field-input:focus {
          border-color: #87aece;
          background: rgba(135,174,206,0.07);
          box-shadow: 0 0 0 3px rgba(135,174,206,0.1);
        }
        .field-input.has-error { border-color: rgba(255,100,100,0.5); }

        .error-msg {
          font-size: 11px;
          color: #ff8080;
          margin-bottom: 16px;
          padding-left: 4px;
        }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #407118 0%, #5a9e24 100%);
          color: #f0f4ff;
          border: 1px solid rgba(175,208,110,0.3);
          border-radius: 12px;
          padding: 14px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
          letter-spacing: 0.03em;
          position: relative;
          overflow: hidden;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(64,113,24,0.45); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary.loading { opacity: 0.7; cursor: default; pointer-events: none; }

        /* Success state */
        .success-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 12px 0;
          animation: fade-in 0.4s ease;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .success-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(175,208,110,0.12);
          border: 1px solid rgba(175,208,110,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #afd06e;
          margin-bottom: 20px;
          box-shadow: 0 0 24px rgba(175,208,110,0.15);
        }
        .success-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #f0f4ff;
          margin-bottom: 10px;
        }
        .success-sub {
          font-size: 13px;
          color: rgba(240,244,255,0.38);
          line-height: 1.65;
          max-width: 280px;
        }
        .success-sub span { color: #afd06e; }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(240,244,255,0.3);
          margin-top: 28px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: #afd06e; }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="fp-root">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
        <div className="bg-grid" />

        <svg className="leaf leaf-1" width="160" height="160" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
          <path d="M50 30 C60 25, 75 30, 80 40" stroke="#407118" strokeWidth="1.5" fill="none"/>
          <path d="M50 50 C60 45, 78 48, 82 58" stroke="#407118" strokeWidth="1.5" fill="none"/>
          <path d="M50 40 C40 35, 25 38, 20 48" stroke="#407118" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="leaf leaf-2" width="130" height="130" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
          <path d="M50 35 C62 28, 78 33, 83 45" stroke="#407118" strokeWidth="1.5" fill="none"/>
        </svg>

        <div className="fp-card">
          <div className="deco-ring" />
          <div className="deco-ring-2" />

          {!submitted ? (
            <>
              <div className="icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
              </div>

              <div className="form-eyebrow">Account recovery</div>
              <div className="form-title">Forgot Password?</div>
              <div className="form-subtitle">
                No worries — enter your email address and we'll send you a link to reset your password.
              </div>

              <form onSubmit={handleSubmit}>
                <label className="field-label">Email Address</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="3"/>
                      <path d="M2 8l10 6 10-6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={`field-input${errors.email ? " has-error" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <div className="error-msg">{errors.email}</div>}

                <button type="submit" className="btn-primary">
                  Send Reset Link
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>

              <a href="/" className="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Sign In
              </a>
            </>
          ) : (
            <div className="success-wrap">
              <div className="success-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </div>
              <div className="success-title">Check your inbox</div>
              <div className="success-sub">
                We've sent a reset link to <span>{email}</span>. It may take a moment to arrive.
              </div>
              <a href="/" className="back-link" style={{marginTop: "32px"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}