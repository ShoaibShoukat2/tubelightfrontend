import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, money, statusLabel } from "./api";
import { Icon } from "./icons";

function useLoad(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api(path).then((row) => alive && setData(row)).catch((err) => alive && setError(err.message));
    return () => { alive = false; };
  }, [path, tick]);
  return { data, error, reload: () => setTick((n) => n + 1), setError };
}

export function Dashboard() {
  const { data, error } = useLoad("/dashboard/");
  const [work, setWork] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!data) return;
    if (data.needs_deposit) navigate("/app/deposit");
    else if (data.needs_plan) navigate("/app/pending");
  }, [data, navigate]);
  useEffect(() => {
    api("/tasks/").then(setWork).catch(() => {});
  }, []);
  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="boot-inline">Loading dashboard...</p>;
  const user = data.user;
  const limit = Number(work?.task_limit || user.daily_limit || 0);
  const done = Number(work?.completed_today || 0);
  const progress = limit ? Math.min(100, Math.round((done / limit) * 100)) : 0;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="dash">
      <section className="wallet-hero">
        <div className="wallet-top">
          <div>
            <p className="eyebrow">{hello}</p>
            <h1>{user.fullname}</h1>
            <p>@{user.username} · {user.plan_name || "No active package"}</p>
          </div>
          <span className="level-pill">Level {user.level ?? 0}</span>
        </div>
        <div className="wallet-figures">
          <div><span>Withdrawable</span><strong>{money(user.balance)}</strong></div>
          <div><span>Bonus wallet</span><strong>{money(user.fanta_balance)}</strong></div>
        </div>
        <div className="task-meter">
          <div className="task-meter-meta">
            <span>Today&apos;s tasks</span>
            <b>{done}/{limit || 0}</b>
          </div>
          <div className="meter" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
          {work?.lock && <p className="meter-note">{work.lock}</p>}
        </div>
      </section>
      <div className="quick-row">
        <Action to="/app/tasks" icon="play" title="Tasks" text="Earn today" />
        {user.account_approved
          ? <Action to="/app/plans" icon="layers" title="Upgrade" text="Change package" />
          : <Action to="/app/deposit" icon="down" title="Deposit" text="Add funds" />}
        <Action to="/app/withdraw" icon="up" title="Withdraw" text="Cash out" />
        <Action to="/app/team" icon="users" title="Team" text="Referrals" />
      </div>
      <div className="dash-stats">
        <Stat label="Deposits" value={money(data.total_deposits)} />
        <Stat label="Task earned" value={money(data.total_earned)} />
        <Stat label="Referral" value={money(data.referral_commission)} />
        <Stat label="Referrals" value={user.referrals ?? 0} />
      </div>
      <div className="dash-split">
        <section className="card insight">
          <div className="panel-head">
            <h3>Package</h3>
            <Link to="/app/plans">Change</Link>
          </div>
          <p className="insight-plan">{user.plan_name || "No package yet"}</p>
          <ul className="insight-list">
            <li><span>Daily task limit</span><b>{user.daily_limit ?? 0}</b></li>
            <li><span>Completed today</span><b>{done}</b></li>
            <li><span>Team size</span><b>{user.referrals ?? 0}</b></li>
          </ul>
          <Link className="btn btn-orange" to="/app/tasks">Continue tasks</Link>
        </section>
        <section className="card dash-panel">
          <div className="panel-head">
            <h3>Recent activity</h3>
            <Link to="/app/transactions">See all</Link>
          </div>
          <TxList rows={data.recent} />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="card stat"><em>{label}</em><b>{value}</b></div>;
}
function Action({ to, title, text, icon }) {
  return (
    <Link className="action" to={to}>
      {icon && <span className="action-ico"><Icon name={icon} /></span>}
      <strong>{title}</strong>
      <span>{text}</span>
    </Link>
  );
}
function TxList({ rows }) {
  if (!rows?.length) return <p className="muted">No transactions yet.</p>;
  return (
    <div className="tx-list">
      {rows.map((row) => (
        <div className="tx-row" key={row.id}>
          <div>
            <strong>{row.details}</strong>
            <span>{fmt(row.created_at)}</span>
          </div>
          <b className={row.trx_type === "+" ? "up" : "down"}>{row.trx_type} {money(row.amount)}</b>
        </div>
      ))}
    </div>
  );
}

export function Pending() {
  return (
    <div className="card">
      <h1 className="page-title">Account pending</h1>
      <p>Your package is not active yet. Deposit a package amount and wait for approval, or buy a plan from your balance.</p>
      <div className="btn-row">
        <Link className="btn btn-orange" to="/app/deposit">Deposit package</Link>
        <Link className="btn btn-line" to="/app/plans">View plans</Link>
      </div>
    </div>
  );
}

export function Plans() {
  const { data, error, reload, setError } = useLoad("/plans/");
  async function buy(id) {
    if (!window.confirm("Buy this plan from your withdrawable balance?")) return;
    try {
      await api("/plans/buy/", { method: "POST", body: { plan_id: id } });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }
  if (!data) return <p>Loading...</p>;
  return (
    <div>
      <h1 className="page-title">Select package</h1>
      {error && <div className="error">{error}</div>}
      <div className="cards-2">
        {data.map((plan) => (
          <article key={plan.id} className={`card plan-card ${plan.current ? "current" : ""}`}>
            <strong>{plan.name}</strong>
            <div className="price">{money(plan.price)}</div>
            <p>{plan.daily_limit} tasks each day</p>
            <p>Daily bonus {money(plan.daily_salary)}</p>
            <p>Monthly bonus {money(plan.monthly_salary)}</p>
            <p className="muted">Referral levels unlocked: {plan.ref_level}</p>
            {plan.current ? <span className="badge ok">Current plan</span> : <button className="btn btn-orange" onClick={() => buy(plan.id)}>Buy from balance</button>}
          </article>
        ))}
      </div>
    </div>
  );
}

export function Tasks() {
  const { data, error } = useLoad("/tasks/");
  if (error) return <div className="error">{error}</div>;
  if (!data) return <p>Loading...</p>;
  return (
    <div>
      <h1 className="page-title">Work room</h1>
      <p className="muted">Level {data.level} · {data.completed_today}/{data.task_limit} tasks today · {data.referrals} referrals</p>
      {data.lock && <div className="error">{data.lock}</div>}
      <div className="card">
        {data.ads.length === 0 && <p>No tasks left for today.</p>}
        {data.ads.map((ad) => (
          <div className="task" key={ad.id}>
            <div>
              <strong>{ad.title}</strong>
              <div className="muted">{ad.duration}s · YouTube</div>
            </div>
            <Link className="btn btn-orange" to={`/app/tasks/${ad.id}`}>Watch</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WatchTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [left, setLeft] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  useEffect(() => {
    api(`/tasks/${id}/`).then((row) => {
      setAd(row);
      setLeft(row.duration || 15);
    }).catch((err) => setError(err.message));
  }, [id]);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  async function confirm() {
    try {
      const data = await api(`/tasks/${id}/confirm/`, { method: "POST", body: {} });
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }
  if (error) return <div className="error">{error}</div>;
  if (!ad) return <p>Loading...</p>;
  const progress = ad.duration ? ((ad.duration - (left || 0)) / ad.duration) * 100 : 100;
  return (
    <div className="card watch">
      <h1 className="page-title">{ad.title}</h1>
      <div className="timer" style={{ "--p": `${progress}%` }}><span>{left}s</span></div>
      <p className="muted">Stay on this screen until the timer ends, then confirm the task.</p>
      {result ? (
        <div className="ok-note">
          Task earn {money(result.earned)}. Bonus {money(result.bonus)}. Tubelight bonus {money(result.salary)}.
          <div className="btn-row">
            <a className="btn btn-blue" href={result.ads_body} target="_blank" rel="noreferrer">Open video</a>
            <button className="btn btn-line" onClick={() => navigate("/app/tasks")}>Back to tasks</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-orange" disabled={left > 0} onClick={confirm}>
          {left > 0 ? "Please wait" : "Confirm task"}
        </button>
      )}
    </div>
  );
}

export function Wallet() {
  const { data, error } = useLoad("/wallet/");
  if (error) return <div className="error">{error}</div>;
  if (!data) return <p>Loading...</p>;
  return (
    <div>
      <h1 className="page-title">Wallet</h1>
      <div className="grid-stats">
        <Stat label="Withdrawable" value={money(data.user.balance)} />
        <Stat label="Tubelight bonus" value={money(data.user.fanta_balance)} />
        <Stat label="Task earned" value={money(data.total_earned)} />
        <Stat label="Referral" value={money(data.referral_commission)} />
      </div>
      <div className="cards-3" style={{ marginTop: 14 }}>
        <Stat label="Withdrawn" value={money(data.withdraw_approved)} />
        <Stat label="Pending withdraw" value={money(data.withdraw_pending)} />
        <Stat label="Rejected" value={money(data.withdraw_rejected)} />
      </div>
    </div>
  );
}

export function Transactions() {
  const { data } = useLoad("/transactions/");
  return <div><h1 className="page-title">Transactions</h1><div className="card"><TxTable rows={data || []} /></div></div>;
}
export function Earnings() {
  const { data } = useLoad("/earnings/");
  return (
    <div>
      <h1 className="page-title">Task earnings</h1>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Task</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            {(data || []).map((row) => <tr key={row.id}><td>#{row.ptc_id}</td><td>{money(row.amount)}</td><td>{fmt(row.view_date)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function Commissions() {
  const { data } = useLoad("/commissions/");
  return (
    <div>
      <h1 className="page-title">Commissions</h1>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>From</th><th>Level</th><th>Amount</th><th>Status</th><th>Details</th></tr></thead>
          <tbody>
            {(data || []).map((row) => (
              <tr key={row.id}><td>{row.from}</td><td>{row.level}</td><td>{money(row.amount)}</td><td>{row.status ? "Credited" : "Pending"}</td><td>{row.details}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function Team() {
  const { data } = useLoad("/team/");
  if (!data) return <p>Loading...</p>;
  const link = `${window.location.origin}/register?ref=${data.ref}`;
  return (
    <div>
      <h1 className="page-title">Your team</h1>
      <div className="card">
        <p>Referral code <strong>{data.ref}</strong></p>
        <p className="muted">{link}</p>
        <button className="btn btn-line" type="button" onClick={() => navigator.clipboard.writeText(link)}>Copy link</button>
        <p>{data.count} direct referrals</p>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>User</th><th>Name</th><th>Joined</th></tr></thead>
          <tbody>{data.users.map((row) => <tr key={row.id}><td>{row.username}</td><td>{row.fullname}</td><td>{fmt(row.created_at)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
export function Rewards() {
  const { data } = useLoad("/rewards/");
  if (!data) return <p>Loading...</p>;
  return (
    <div>
      <h1 className="page-title">Rewards and levels</h1>
      <div className="cards-3">
        <Stat label="Current level" value={data.level} />
        <Stat label="Referrals" value={data.referrals} />
        <Stat label="Daily tasks" value={data.daily_limit} />
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        {data.levels.map((level) => (
          <div className="task" key={level.level}>
            <div><strong>Level {level.level}</strong><div className="muted">{level.referrals_required} referrals · {level.daily_limit} tasks</div></div>
            <span className={`badge ${level.reached ? "ok" : ""}`}>{level.reached ? "Reached" : "Locked"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Rules() {
  const plans = [
    ["Basic", "1,000", "30,000"],
    ["Standard", "1,500", "45,000"],
    ["Premium", "2,500", "75,000"],
    ["Super Premium", "3,700", "111,000"],
  ];
  return (
    <div>
      <h1 className="page-title">Salary rules</h1>
      <div className="card"><p>Salary is extra income credited to your Tubelight bonus wallet as you complete the daily tasks of your package.</p></div>
      <div className="cards-2" style={{ marginTop: 14 }}>
        {plans.map(([name, daily, monthly]) => (
          <article className="card" key={name}><h3>{name}</h3><p>Daily salary Rs {daily}</p><p>Monthly salary Rs {monthly}</p></article>
        ))}
      </div>
    </div>
  );
}
export function Guide() {
  return (
    <div className="card">
      <h1 className="page-title">Guide</h1>
      <ol>
        <li>Register and keep your referral code.</li>
        <li>Deposit a package amount with sender number and payment screenshot.</li>
        <li>After approval, open the work room and complete your daily tasks.</li>
        <li>Each task adds Rs 5 (more at higher levels) to withdrawable balance.</li>
        <li>The package daily bonus goes to the Tubelight bonus wallet.</li>
        <li>First withdrawal is Rs 55. Later withdrawals start at Rs 550.</li>
      </ol>
    </div>
  );
}

export function Deposit() {
  const gates = useLoad("/gateways/");
  const plans = useLoad("/plans/");
  const [form, setForm] = useState({ method_code: "", amount: "750", sender_number: "" });
  const selected = (gates.data || []).find((gate) => String(gate.method_code) === String(form.method_code));
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setError("");
    const body = new FormData();
    body.append("method_code", form.method_code);
    body.append("amount", form.amount);
    body.append("sender_number", form.sender_number);
    if (file) body.append("payment_screenshot", file);
    try {
      await api("/deposits/", { method: "POST", form: body });
      setDone("Deposit request submitted.");
      setTimeout(() => navigate("/app/deposits"), 700);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Deposit</h1>
      <p className="muted">Choose a package price so approval activates that package. Other amounts are credited to the wallet.</p>
      {error && <div className="error">{error}</div>}
      {done && <div className="ok-note">{done}</div>}
      <form onSubmit={submit}>
        <label className="field"><span>Method</span>
          <select value={form.method_code} onChange={(e) => setForm({ ...form, method_code: e.target.value })}>
            <option value="">Select</option>
            {(gates.data || []).map((gate) => <option key={gate.method_code} value={gate.method_code}>{gate.name}</option>)}
          </select>
        </label>
        {selected?.description && <p className="muted">{selected.description}</p>}
        <label className="field"><span>Amount</span>
          <select value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}>
            {(plans.data || []).map((plan) => <option key={plan.id} value={Number(plan.price)}>{plan.name} — {money(plan.price)}</option>)}
          </select>
        </label>
        <label className="field"><span>Sender number</span><input value={form.sender_number} onChange={(e) => setForm({ ...form, sender_number: e.target.value })} /></label>
        <label className="field"><span>Payment screenshot</span><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} /></label>
        <button className="btn btn-orange" type="submit">Submit deposit</button>
      </form>
    </div>
  );
}

export function Deposits() {
  const { data } = useLoad("/deposits/");
  return <MoneyList title="Deposit history" rows={data} kind="deposit" />;
}
export function Withdraw() {
  const methods = useLoad("/withdraw/methods/");
  const [form, setForm] = useState({ method_id: "", amount: "", account: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    try {
      await api("/withdrawals/", { method: "POST", body: form });
      navigate("/app/withdrawals");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Withdraw</h1>
      <p className="muted">First withdrawal minimum is Rs 55. After that the minimum is Rs 550.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <label className="field"><span>Method</span>
          <select value={form.method_id} onChange={(e) => setForm({ ...form, method_id: e.target.value })}>
            <option value="">Select</option>
            {(methods.data || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Amount</span><input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <label className="field"><span>Account number</span><input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} /></label>
        <button className="btn btn-orange" type="submit">Request withdraw</button>
      </form>
    </div>
  );
}
export function Withdrawals() {
  const { data } = useLoad("/withdrawals/");
  return <MoneyList title="Withdraw history" rows={data} kind="withdraw" />;
}

function MoneyList({ title, rows, kind }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>TRX</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {(rows || []).map((row) => (
              <tr key={row.id}>
                <td>{row.trx}</td>
                <td>{money(row.amount)}</td>
                <td><Badge status={row.status} kind={kind} /></td>
                <td>{fmt(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Transfer() {
  const [form, setForm] = useState({ username: "", amount: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/transfer/", { method: "POST", body: form });
      setDone("Transfer sent.");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1 className="page-title">Transfer balance</h1>
      {error && <div className="error">{error}</div>}
      {done && <div className="ok-note">{done}</div>}
      <form onSubmit={submit}>
        <label className="field"><span>Username</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label className="field"><span>Amount</span><input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <button className="btn btn-orange">Send</button>
      </form>
    </div>
  );
}

export function Profile() {
  const { data, reload, error, setError } = useLoad("/profile/");
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (data) setForm({ ...data, ...(data.address || {}) });
  }, [data]);
  async function submit(event) {
    event.preventDefault();
    try {
      await api("/profile/", { method: "POST", body: form });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }
  if (!form) return <p>Loading...</p>;
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Profile</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        {["first_name", "last_name", "mobile", "address", "city", "state", "zip"].map((key) => (
          <label className="field" key={key}><span>{key.replace("_", " ")}</span>
            <input value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </label>
        ))}
        <button className="btn btn-orange">Save</button>
      </form>
    </div>
  );
}

export function Password() {
  const [form, setForm] = useState({ current_password: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/password/", { method: "POST", body: form });
      setMessage("Password changed.");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1 className="page-title">Change password</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="ok-note">{message}</div>}
      <form onSubmit={submit}>
        <label className="field"><span>Current password</span><input type="password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} /></label>
        <label className="field"><span>New password</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn btn-orange">Update</button>
      </form>
    </div>
  );
}

export function Ads() {
  const { data, error, reload, setError } = useLoad("/ads/");
  const [form, setForm] = useState({ title: "", ads_body: "", duration: 15, max_show: 100, ads_type: 4 });
  async function submit(event) {
    event.preventDefault();
    try {
      await api("/ads/", { method: "POST", body: form });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div>
      <h1 className="page-title">My ads</h1>
      {error && <div className="error">{error}</div>}
      <form className="card" onSubmit={submit}>
        <label className="field"><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className="field"><span>YouTube or website link</span><input value={form.ads_body} onChange={(e) => setForm({ ...form, ads_body: e.target.value })} /></label>
        <label className="field"><span>Shows</span><input value={form.max_show} onChange={(e) => setForm({ ...form, max_show: e.target.value })} /></label>
        <button className="btn btn-orange">Create ad</button>
      </form>
      <div className="card">{(data?.ads || []).map((ad) => (
        <div className="task" key={ad.id}>
          <strong>{ad.title}</strong>
          <button className="btn btn-line" type="button" onClick={async () => { await api(`/ads/${ad.id}/status/`, { method: "POST", body: {} }); reload(); }}>{ad.status === 1 ? "Pause" : "Activate"}</button>
        </div>
      ))}</div>
    </div>
  );
}

export function Support() {
  const { data } = useLoad("/tickets/");
  return (
    <div>
      <div className="topbar"><h1 className="page-title">Support</h1><Link className="btn btn-orange" to="/app/support/new">New ticket</Link></div>
      <div className="card">
        {(data || []).map((row) => (
          <Link className="task" key={row.id} to={`/app/support/${row.ticket}`}>
            <div><strong>{row.subject}</strong><div className="muted">#{row.ticket}</div></div>
            <span className="badge">{row.status_label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
export function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: "", message: "", priority: 2 });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      const row = await api("/tickets/", { method: "POST", body: form });
      navigate(`/app/support/${row.ticket}`);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h1 className="page-title">Open ticket</h1>
      {error && <div className="error">{error}</div>}
      <label className="field"><span>Subject</span><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
      <label className="field"><span>Message</span><textarea rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
      <button className="btn btn-orange">Submit</button>
    </form>
  );
}
export function TicketView() {
  const { ticket } = useParams();
  const { data, reload, error, setError } = useLoad(`/tickets/${ticket}/`);
  const [message, setMessage] = useState("");
  async function reply(event) {
    event.preventDefault();
    try {
      await api(`/tickets/${ticket}/`, { method: "POST", body: { message } });
      setMessage("");
      reload();
    } catch (err) {
      setError(err.message);
    }
  }
  if (!data) return <p>Loading...</p>;
  return (
    <div className="card">
      <h1 className="page-title">{data.subject}</h1>
      {error && <div className="error">{error}</div>}
      {(data.messages || []).map((item) => (
        <div key={item.id} className={item.admin ? "ok-note" : "card"} style={{ marginBottom: 10 }}>
          <strong>{item.admin ? "Support" : "You"}</strong>
          <p>{item.message}</p>
        </div>
      ))}
      <form onSubmit={reply}>
        <label className="field"><span>Reply</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <div className="btn-row">
          <button className="btn btn-orange">Send</button>
          <button className="btn btn-line" type="button" onClick={async () => { await api(`/tickets/${ticket}/close/`, { method: "POST", body: {} }); reload(); }}>Close ticket</button>
        </div>
      </form>
    </div>
  );
}

function TxTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Details</th><th>Amount</th><th>Balance</th><th>Date</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.details}</td>
              <td>{row.trx_type} {money(row.amount)}</td>
              <td>{money(row.post_balance)}</td>
              <td>{fmt(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Badge({ status, kind }) {
  const label = statusLabel(kind, Number(status));
  const cls = label === "Approved" ? "ok" : label === "Pending" ? "wait" : label === "Rejected" ? "bad" : "";
  return <span className={`badge ${cls}`}>{label}</span>;
}
export function Feedback() {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const row = await api("/feedback/", { method: "POST", body: { message } });
      setDone(`Feedback sent as ticket #${row.ticket}.`);
      setMessage("");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="card" style={{ maxWidth: 640 }} onSubmit={submit}>
      <h1 className="page-title">Feedback</h1>
      {error && <div className="error">{error}</div>}
      {done && <div className="ok-note">{done}</div>}
      <label className="field"><span>Message</span><textarea rows="5" value={message} onChange={(e) => setMessage(e.target.value)} /></label>
      <button className="btn btn-orange">Submit</button>
    </form>
  );
}

export function Kyc() {
  const { data, error, reload, setError } = useLoad("/kyc/");
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [done, setDone] = useState("");
  async function submit(event) {
    event.preventDefault();
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => body.append(key, value));
    Object.entries(files).forEach(([key, file]) => file && body.append(key, file));
    try {
      await api("/kyc/", { method: "POST", form: body });
      setDone("KYC submitted. Wait for admin approval.");
      reload();
    } catch (err) {
      setError(err.message);
    }
  }
  if (!data) return <p>Loading...</p>;
  const label = { 0: "Not submitted", 1: "Verified", 2: "Under review" }[data.kv] || "Unknown";
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1 className="page-title">KYC</h1>
      <p>Status: <strong>{label}</strong></p>
      {error && <div className="error">{error}</div>}
      {done && <div className="ok-note">{done}</div>}
      {data.kv === 1 && <p>Your identity is verified. Withdrawals are open.</p>}
      {data.kv === 2 && <p>Documents are with the admin. Withdrawals stay closed until approval.</p>}
      {data.kv === 0 && (
        <form onSubmit={submit}>
          {(data.fields || []).map((field) => (
            <label className="field" key={field.key}><span>{field.name}</span>
              {field.type === "file" ? (
                <input type="file" onChange={(e) => setFiles({ ...files, [field.key]: e.target.files?.[0] })} />
              ) : field.type === "textarea" ? (
                <textarea value={values[field.key] || ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              ) : (
                <input value={values[field.key] || ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
              )}
            </label>
          ))}
          <button className="btn btn-orange">Submit KYC</button>
        </form>
      )}
    </div>
  );
}

function fmt(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}
