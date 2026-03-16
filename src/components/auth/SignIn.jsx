import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function SignIn() {
    const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState("");

  const validate = () => {
    let newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) console.log("Login details ready for backend");
    navigate("/dashboard")
  };

  const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("User:", result.user);
    navigate("/dashboard")
  } catch (error) {
    console.error("Google login error:", error);
  }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.08); }
        }
        @keyframes leaf-sway {
          from { transform: rotate(0deg) scale(1); }
          to   { transform: rotate(8deg) scale(1.05); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
        .animate-drift-1 { animation: drift 12s ease-in-out infinite alternate; }
        .animate-drift-2 { animation: drift 12s ease-in-out infinite alternate; animation-delay: -4s; }
        .animate-drift-3 { animation: drift 12s ease-in-out infinite alternate; animation-delay: -8s; }
        .animate-drift-4 { animation: drift 12s ease-in-out infinite alternate; animation-delay: -2s; }
        .animate-leaf-1 { animation: leaf-sway 8s ease-in-out infinite alternate; }
        .animate-leaf-2 { animation: leaf-sway 8s ease-in-out infinite alternate; animation-delay: -3s; }
        .animate-leaf-3 { animation: leaf-sway 8s ease-in-out infinite alternate; animation-delay: -5s; }
        .animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        .card-top-border::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #407118 20%, #afd06e 55%, #87aece 80%, transparent);
        }
        .btn-primary-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 100%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-primary-shine:hover::after { opacity: 1; }
        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(175,208,110,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(175,208,110,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .field-input:focus {
          border-color: #87aece;
          background: rgba(135,174,206,0.07);
          box-shadow: 0 0 0 3px rgba(135,174,206,0.1);
        }
        .field-icon-wrap:focus-within .field-icon { opacity: 1; }
      `}</style>

      <div className="font-dm relative min-h-screen flex overflow-hidden bg-[#0e1628]">

        {/* Background blobs */}
        <div className="animate-drift-1 absolute w-[500px] h-[500px] rounded-full bg-[#87aece] opacity-[0.18] blur-[80px] -top-[100px] -left-[100px] pointer-events-none" />
        <div className="animate-drift-2 absolute w-[500px] h-[500px] rounded-full bg-[#afd06e] opacity-[0.28] blur-[80px] -bottom-[100px] right-[15%] pointer-events-none" />
        <div className="animate-drift-3 absolute w-[320px] h-[320px] rounded-full bg-[#407118] opacity-30 blur-[80px] top-[40%] -right-[60px] pointer-events-none" />
        <div className="animate-drift-4 absolute w-[260px] h-[260px] rounded-full bg-[#afd06e] opacity-[0.12] blur-[80px] top-[10%] left-[35%] pointer-events-none" />
        <div className="bg-grid-pattern absolute inset-0 pointer-events-none" />

        {/* Leaf decorations */}
        <svg className="animate-leaf-1 absolute top-[8%] right-[12%] opacity-[0.07] pointer-events-none" width="180" height="180" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
          <path d="M50 30 C60 25, 75 30, 80 40" stroke="#407118" strokeWidth="1.5" fill="none"/>
          <path d="M50 50 C60 45, 78 48, 82 58" stroke="#407118" strokeWidth="1.5" fill="none"/>
          <path d="M50 40 C40 35, 25 38, 20 48" stroke="#407118" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="animate-leaf-2 absolute bottom-[12%] left-[8%] opacity-[0.07] pointer-events-none rotate-[120deg]" width="140" height="140" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
          <path d="M50 35 C62 28, 78 33, 83 45" stroke="#407118" strokeWidth="1.5" fill="none"/>
          <path d="M50 55 C38 48, 22 53, 18 65" stroke="#407118" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="animate-leaf-3 absolute top-[55%] left-[42%] opacity-[0.05] pointer-events-none rotate-[60deg]" width="220" height="220" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
        </svg>

        {/* Left: Brand panel */}
        <div className="flex-1 hidden md:flex flex-col justify-center px-16 py-[60px] relative z-10">
          <div className="inline-flex items-center gap-2 bg-[rgba(175,208,110,0.1)] border border-[rgba(175,208,110,0.25)] rounded-full px-3.5 py-1.5 w-fit mb-10">
            <div className="animate-pulse-dot w-[7px] h-[7px] bg-[#afd06e] rounded-full shadow-[0_0_8px_#afd06e]" />
            <span className="text-xs font-medium text-[#afd06e] tracking-[0.08em] uppercase">Farm Flow Dashboard</span>
          </div>

          <h1 className="font-playfair text-[clamp(36px,4vw,52px)] font-semibold text-[#f0f4ff] leading-[1.15] mb-5">
            Grow smarter.<br />
            <span className="text-[#afd06e]">Harvest better.</span>
          </h1>

          <p className="text-[15px] text-[rgba(240,244,255,0.45)] leading-[1.7] max-w-[340px] mb-14">
            Monitor your aquaponics ecosystem in real time; water quality, fish health, plant cycles, and yield analytics, all in one place.
          </p>

          <div className="flex gap-9">
            {[
              { value: "98.4%", label: "System uptime" },
              { value: "12k+",  label: "Active growers" },
              { value: "4.9★",  label: "Avg rating" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-playfair text-[28px] text-[#afd06e] font-semibold">{value}</div>
                <div className="text-[11px] text-[rgba(240,244,255,0.35)] uppercase tracking-[0.1em] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="hidden md:block w-px my-12 relative z-10 shrink-0"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(135,174,206,0.2) 30%, rgba(135,174,206,0.2) 70%, transparent)" }}
        />

        {/* Right: Form panel */}
        <div className="w-full md:w-115 shrink-0 flex items-center justify-center px-5 py-12 md:px-10 relative z-10">
          <div className="card-top-border relative w-full bg-[rgba(64,113,24,0.06)] border border-[rgba(175,208,110,0.18)] rounded-3xl px-10 py-11 backdrop-blur-xl overflow-hidden">

            {/* Deco rings — bottom-right this time */}
            <div className="absolute -bottom-7.5 -right-7.5 w-30 h-30 rounded-full border border-[rgba(175,208,110,0.14)]" />
            <div className="absolute -bottom-15 -right-15 w-45 h-45 rounded-full border border-[rgba(64,113,24,0.12)]" />

            <div className="font-playfair text-[26px] text-[#f0f4ff] font-semibold mb-1.5">Sign In</div>
            <div className="text-[13px] text-[rgba(240,244,255,0.38)] mb-9 leading-relaxed">Enter your credentials to access your dashboard</div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-[11px] font-medium text-[rgba(240,244,255,0.5)] tracking-[0.08em] uppercase mb-2">Email Address</label>
                <div className="field-icon-wrap relative">
                  <span className="field-icon absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 transition-opacity duration-200 pointer-events-none text-[#87aece]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="3"/>
                      <path d="M2 8l10 6 10-6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="youremail@africau.edu"
                    className={`field-input w-full bg-[rgba(255,255,255,0.04)] border rounded-xl py-[13px] pl-10 pr-3.5 text-sm text-[#f0f4ff] outline-none transition-all duration-200 placeholder:text-[rgba(240,244,255,0.2)] ${errors.email ? "border-[rgba(255,100,100,0.5)]" : "border-[rgba(135,174,206,0.2)]"}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                  />
                </div>
                {errors.email && <div className="text-[11px] text-[#ff8080] mt-1 pl-1">{errors.email}</div>}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-[11px] font-medium text-[rgba(240,244,255,0.5)] tracking-[0.08em] uppercase mb-2">Password</label>
                <div className="field-icon-wrap relative">
                  <span className="field-icon absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 transition-opacity duration-200 pointer-events-none text-[#87aece]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`field-input w-full bg-[rgba(255,255,255,0.04)] border rounded-xl py-[13px] pl-10 pr-3.5 text-sm text-[#f0f4ff] outline-none transition-all duration-200 placeholder:text-[rgba(240,244,255,0.2)] ${errors.password ? "border-[rgba(255,100,100,0.5)]" : "border-[rgba(135,174,206,0.2)]"}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                  />
                </div>
                {errors.password && <div className="text-[11px] text-[#ff8080] mt-1 pl-1">{errors.password}</div>}
              </div>

              <a
                href="/forgotpassword"
                className="block text-right text-xs text-[#afd06e] no-underline ml-auto w-fit -mt-1.5 mb-7 transition-opacity duration-200 hover:opacity-70"
              >
                Forgot password?
              </a>

              <button
                type="submit"
                className="btn-primary-shine relative w-full bg-linear-to-br from-[#407118] to-[#5a9e24] text-[#f0f4ff] border border-[rgba(175,208,110,0.3)] rounded-xl py-3.5 text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 overflow-hidden hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(64,113,24,0.45)] active:translate-y-0"
              >
                Sign In to Dashboard
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[rgba(175,208,110,0.15)]" />
              <span className="text-[11px] text-[rgba(240,244,255,0.25)] tracking-[0.08em] uppercase">or</span>
              <div className="flex-1 h-px bg-[rgba(175,208,110,0.15)]" />
            </div>

            {/* Google button */}
            <button
              type="button"
               onClick={handleGoogleLogin}
              className="w-full bg-transparent border border-[rgba(135,174,206,0.2)] rounded-xl px-4 py-3.25 flex items-center justify-center gap-2.5 text-[13px] text-[rgba(82,117,214,0.6)] cursor-pointer transition-all duration-200 hover:border-[rgba(135,174,206,0.45)] hover:bg-[rgba(135,174,206,0.06)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="text-center text-xs text-[rgba(240,244,255,0.3)] mt-6">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#afd06e] no-underline font-medium transition-opacity duration-200 hover:opacity-70">
                Create one here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}