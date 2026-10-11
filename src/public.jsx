import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, money, setSession } from "./api";

export function Home() {
  const [plans, setPlans] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    api("/health/").then((data) => setPlans(data.plans || [])).catch(() => {});
  }, []);
  function closeMenu() { setMenuOpen(false); }
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" to="/" onClick={closeMenu}><span className="brand-mark">T</span> TubeLight</Link>
          <button className="btn btn-line nav-toggle" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? "Close" : "Menu"}
          </button>
          <nav className={`site-nav ${menuOpen ? "open" : ""}`} onClick={closeMenu}>
            <a className="nav-link" href="#how">How it works</a>
            <a className="nav-link" href="#packages">Packages</a>
            <Link className="btn btn-ghost" to="/login">Login</Link>
            <Link className="btn btn-orange" to="/register">Create account</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner hero-grid">
          <div>
            <p className="eyebrow">Watch. Earn. Withdraw.</p>
            <h1>A clear way to earn from daily tasks and your team.</h1>
            <p className="lead">
              Buy a package, finish your daily YouTube tasks, and collect withdrawable balance
              plus Tubelight bonus. Referral commission stays on the same levels as before.
            </p>
            <div className="btn-row">
              <Link className="btn btn-orange" to="/register">Start earning</Link>
              <Link className="btn btn-ghost" to="/login">I already have an account</Link>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-head">
              <span>Account snapshot</span>
              <span className="live-dot" aria-hidden="true" />
            </div>
            <div className="stat-row">
              <div className="glass-stat"><b>Rs 5</b><span>Task earn at level 0</span></div>
              <div className="glass-stat"><b>Rs 1,000</b><span>Basic daily bonus</span></div>
              <div className="glass-stat"><b>25%</b><span>Level 1 join commission</span></div>
              <div className="glass-stat"><b>Rs 55</b><span>First withdrawal</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="trust-row">
          <div><strong>Daily tasks</strong><span>Watch and confirm to earn</span></div>
          <div><strong>Two wallets</strong><span>Balance and bonus stay separate</span></div>
          <div><strong>Team income</strong><span>Commission by referral level</span></div>
          <div><strong>Withdrawals</strong><span>Request cash out from wallet</span></div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="section-inner">
          <p className="eyebrow">How it works</p>
          <h2>Three steps, same earning flow.</h2>
          <p className="muted">The account rules have not changed. The screens are just easier to use.</p>
          <div className="steps">
            <article className="step"><i>01</i><b>Create an account</b><p className="muted">Register with an optional referral code. Your own code is created automatically.</p></article>
            <article className="step"><i>02</i><b>Activate a package</b><p className="muted">Deposit or buy a plan. Daily task count and bonus follow that package.</p></article>
            <article className="step"><i>03</i><b>Complete tasks</b><p className="muted">Watch the task, wait for the timer, then confirm. Earnings land in your wallet.</p></article>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="packages">
        <div className="section-inner">
          <p className="eyebrow">Packages</p>
          <h2>Choose the plan that matches your day.</h2>
          <p className="muted">Prices, daily tasks, and Tubelight bonus match the current site.</p>
          <div className="cards-4" style={{ marginTop: 22 }}>
            {plans.length === 0 && <p className="muted">Packages will appear here when the server is connected.</p>}
            {plans.map((plan) => (
              <article className="card plan-card" key={plan.id}>
                <strong>{plan.name}</strong>
                <div className="price">{money(plan.price)}</div>
                <p>{plan.daily_limit} task{plan.daily_limit > 1 ? "s" : ""} / day</p>
                <p>Daily bonus {money(plan.daily_salary)}</p>
                <p className="muted">Monthly {money(plan.monthly_salary)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <p className="eyebrow">Inside the account</p>
          <h2>Everything you need stays in one place.</h2>
          <div className="features">
            <article className="feature"><b>Wallet</b><p className="muted">See withdrawable balance, bonus, deposits, and recent movement.</p></article>
            <article className="feature"><b>Team</b><p className="muted">Share your referral link and track the people who join under you.</p></article>
            <article className="feature"><b>Support</b><p className="muted">Open a ticket, check rules, and complete KYC from the same menu.</p></article>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-box">
          <div>
            <h2>Ready to open your account?</h2>
            <p>Login if you already have a username. New members can register in a minute.</p>
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <Link className="btn btn-orange" to="/register">Create account</Link>
            <Link className="btn btn-invert" to="/login">Login</Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="brand"><span className="brand-mark">T</span> TubeLight</div>
          <div className="footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/forgot">Reset password</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Login() {
  return <AuthForm mode="login" />;
}
export function Register() {
  return <AuthForm mode="register" />;
}
export function Forgot() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  async function send(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/auth/forgot/", { method: "POST", body: { email } });
      setInfo(data.code ? `Code: ${data.code}` : "Code sent.");
    } catch (err) {
      setError(err.message);
    }
  }
  async function reset(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/auth/reset/", { method: "POST", body: { email, code, password } });
      setInfo("Password updated. You can log in.");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <AuthShell title="Reset password" text="Use the verification code stored on your account.">
      {error && <div className="error">{error}</div>}
      {info && <div className="ok-note">{info}</div>}
      <form onSubmit={send}>
        <label className="field"><span>Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="btn btn-blue" type="submit">Get code</button>
      </form>
      <form onSubmit={reset} style={{ marginTop: 18 }}>
        <label className="field"><span>Code</span><input value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <label className="field"><span>New password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-orange" type="submit">Update password</button>
      </form>
    </AuthShell>
  );
}

function AuthForm({ mode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    first_name: "", last_name: "", username: "", email: "", mobile: "",
    password: "", password_confirmation: "", ref: params.get("ref") || "",
  });
  const [error, setError] = useState("");
  function set(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const path = mode === "login" ? "/auth/login/" : "/auth/register/";
      const data = await api(path, { method: "POST", body: form });
      setSession(data.token, "user");
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <AuthShell
      title={mode === "login" ? "Welcome back" : "Create your account"}
      text={mode === "login" ? "Sign in with your username and password." : "Referral code is optional. Your own code is created automatically."}
    >
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        {mode === "register" && (
          <>
            <div className="field-row">
              <label className="field"><span>First name</span><input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} /></label>
              <label className="field"><span>Last name</span><input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} /></label>
            </div>
            <label className="field"><span>Mobile</span><input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></label>
            <label className="field"><span>Referral code</span><input value={form.ref} onChange={(e) => set("ref", e.target.value)} /></label>
          </>
        )}
        <label className="field"><span>Username{mode === "login" ? " or email" : ""}</span><input value={form.username} onChange={(e) => set("username", e.target.value)} /></label>
        {mode === "register" && <label className="field"><span>Email</span><input value={form.email} onChange={(e) => set("email", e.target.value)} /></label>}
        <label className="field"><span>Password</span><input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></label>
        {mode === "register" && <label className="field"><span>Confirm password</span><input type="password" value={form.password_confirmation} onChange={(e) => set("password_confirmation", e.target.value)} /></label>}
        <button className="btn btn-orange" type="submit" style={{ width: "100%" }}>{mode === "login" ? "Login" : "Register"}</button>
      </form>
      <p className="muted">{mode === "login" ? <Link to="/register">Create account</Link> : <Link to="/login">Already registered?</Link>} · <Link to="/forgot">Forgot password</Link></p>
    </AuthShell>
  );
}

function AuthShell({ title, text, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-art">
        <Link className="brand" to="/"><span className="brand-mark">T</span> TubeLight</Link>
        <div>
          <h2>Same tasks. Same wallet. A calmer screen.</h2>
          <p>Packages, daily limits, bonus, and referral rates stay exactly as they are today.</p>
          <div className="auth-points">
            <span>Daily YouTube tasks with a visible timer</span>
            <span>Withdrawable balance and Tubelight bonus</span>
            <span>Team commission by referral level</span>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <Link className="brand auth-mobile-brand" to="/"><span className="brand-mark">T</span> TubeLight</Link>
          <h2>{title}</h2>
          <p className="muted">{text}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
