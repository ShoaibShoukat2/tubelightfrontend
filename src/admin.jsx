import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, money, setSession, statusLabel } from "./api";

function useLoad(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    api(path).then(setData).catch((err) => setError(err.message));
  }, [path, tick]);
  return { data, error, reload: () => setTick((n) => n + 1) };
}

export function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      const data = await api("/admin/login/", { method: "POST", body: form });
      setSession(data.token, "admin");
      navigate("/admin/home");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-art"><h2>TubeLight admin</h2><p>Approve deposits, withdrawals, packages and tickets.</p></div>
      <div className="auth-panel">
        <form className="auth-box" onSubmit={submit}>
          <Link className="brand auth-mobile-brand" to="/"><span className="brand-mark">T</span> TubeLight</Link>
          <h2>Admin login</h2>
          {error && <div className="error">{error}</div>}
          <label className="field"><span>Username</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label className="field"><span>Password</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <button className="btn btn-orange" type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export function AdminHome() {
  const { data, error } = useLoad("/admin/dashboard/");
  if (error) return <div className="error">{error}</div>;
  if (!data) return <p>Loading...</p>;
  const cards = [
    ["/admin/users", "Users", data.users, "All accounts"],
    ["/admin/users?scope=active", "Active", data.active_users, "Can log in"],
    ["/admin/deposits?status=pending", "New requests", data.pending_deposits, "Waiting approval"],
    ["/admin/withdrawals?status=pending", "Withdrawals", data.pending_withdrawals, "Waiting payout"],
    ["/admin/tickets", "Tickets", data.open_tickets, "Need a reply"],
    ["/admin/reports", "Balances", money(data.total_balance), "User wallets"],
  ];
  return (
    <div className="dash">
      <section className="dash-hero admin-hero">
        <div>
          <p className="eyebrow">Control room</p>
          <h1>Admin dashboard</h1>
          <p>{data.users} users · {data.banned_users} banned</p>
        </div>
        <div className="dash-balances">
          <div><span>Pending deposits</span><strong>{data.pending_deposits}</strong></div>
          <div><span>Pending withdrawals</span><strong>{data.pending_withdrawals}</strong></div>
        </div>
      </section>
      <div className="dash-stats">
        {cards.map(([to, label, value, hint]) => (
          <Link className="card stat stat-link" to={to} key={label}>
            <em>{label}</em>
            <b>{value}</b>
            <span>{hint}</span>
          </Link>
        ))}
      </div>
      <div className="dash-split">
        <section className="card dash-panel">
          <div className="panel-head"><h3>Alerts</h3></div>
          {(data.notifications || []).length === 0 && <p className="muted">No new alerts.</p>}
          {(data.notifications || []).map((item) => (
            <div className="tx-row" key={item.id}><strong>{item.title}</strong></div>
          ))}
        </section>
        <section className="card dash-panel">
          <div className="panel-head"><h3>Shortcuts</h3></div>
          <div className="dash-actions">
            <Action to="/admin/deposits?status=pending" title="New requests" text="View payments" />
            <Action to="/admin/withdrawals?status=pending" title="Withdrawals" text="Pay requests" />
            <Action to="/admin/users" title="Users" text="Search accounts" />
            <Action to="/admin/gateways" title="Gateways" text="Easypaisa & JazzCash" />
          </div>
        </section>
      </div>
    </div>
  );
}
function Action({ to, title, text }) {
  return <Link className="action" to={to}><strong>{title}</strong><span>{text}</span></Link>;
}

function when(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function tone(kind, status) {
  const n = Number(status);
  if (n === 1) return "badge ok";
  if (n === 2) return "badge wait";
  if (n === 3) return "badge bad";
  return "badge";
}
function isImage(url) {
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url || "");
}
function ProofShot({ proof }) {
  const primary = proof.url || "";
  const fallback = primary.startsWith("/media/") ? `/assets/verify/${primary.slice("/media/".length)}` : "";
  const [src, setSrc] = useState(primary);
  if (!primary) return <p>{Array.isArray(proof.value) ? proof.value.join(", ") : (proof.value || "—")}</p>;
  if (!isImage(primary) && !isImage(fallback)) {
    return <div><a href={primary} target="_blank" rel="noreferrer">Open file</a></div>;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img
        className="proof-shot"
        src={src}
        alt={proof.name || "Payment screenshot"}
        onError={() => { if (fallback && src !== fallback) setSrc(fallback); }}
      />
    </a>
  );
}
function Proofs({ proofs }) {
  if (!proofs || proofs.length === 0) return <p className="muted">No payment screenshot uploaded.</p>;
  return proofs.map((proof, index) => (
    <div className="proof" key={`${proof.name}-${index}`}>
      <strong>{proof.name || "Detail"}</strong>
      <ProofShot proof={proof} />
    </div>
  ));
}
function writeParams(params, patch) {
  const next = new URLSearchParams(params);
  Object.entries(patch).forEach(([key, value]) => {
    if (value) next.set(key, value);
    else next.delete(key);
  });
  return next;
}

export function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const scope = params.get("scope") || "all";
  const [query, setQuery] = useState(params.get("q") || "");
  const search = params.toString();
  const { data, error } = useLoad(`/admin/users/${search ? `?${search}` : ""}`);
  const rows = data?.rows || [];
  const titles = { all: "All users", approved: "Approved users", active: "Active users", banned: "Banned users", balance: "Users with balance", today: "Joined today" };
  function submit(event) {
    event.preventDefault();
    setParams(writeParams(params, { q: query.trim() }));
  }
  return (
    <div>
      <h1 className="page-title">{titles[scope] || "Users"}</h1>
      {error && <div className="error">{error}</div>}
      <div className="filters">
        {[["all", "All"], ["approved", "Approved"], ["active", "Active"], ["banned", "Banned"], ["balance", "With balance"]].map(([id, label]) => (
          <button key={id} type="button" className={scope === id ? "btn btn-orange" : "btn btn-line"} onClick={() => setParams(writeParams(params, { scope: id === "all" ? "" : id }))}>{label}</button>
        ))}
      </div>
      <form className="search-row" onSubmit={submit}>
        <label className="field"><span>Search username, email, mobile or name</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" />
        </label>
        <button className="btn btn-orange" type="submit">Search</button>
      </form>
      <p className="muted">{data ? `${rows.length} shown${data.total > rows.length ? ` of ${data.total}` : ""}` : "Loading..."}</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>User</th><th>Upline</th><th>Email / phone</th><th>Joined</th><th>Balance</th><th>Level</th><th>Daily</th><th></th></tr></thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.fullname}</strong><div className="muted">@{user.username}</div></td>
                <td>{user.upline ? <Link to={`/admin/users/${user.upline.id}`}>@{user.upline.username}</Link> : "Direct"}</td>
                <td>{user.email}<div className="muted">{user.mobile || "—"}</div></td>
                <td>{when(user.created_at)}</td>
                <td>{money(user.balance)}<div className="muted">Bonus {money(user.fanta_balance)}</div></td>
                <td>{user.level}</td>
                <td>{user.daily_limit}</td>
                <td><Link className="btn btn-line" to={`/admin/users/${user.id}`}>Details</Link></td>
              </tr>
            ))}
            {data && rows.length === 0 && <tr><td colSpan="8">No users match this search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminUser() {
  const { id } = useParams();
  const { data, error, reload } = useLoad(`/admin/users/${id}/`);
  const [form, setForm] = useState(null);
  const [amount, setAmount] = useState("100");
  const [wallet, setWallet] = useState("balance");
  const [remark, setRemark] = useState("Admin adjustment");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!data?.user) return;
    const address = data.user.address || {};
    setForm({
      first_name: data.user.first_name || "",
      last_name: data.user.last_name || "",
      email: data.user.email || "",
      mobile: data.user.mobile || "",
      plan_id: data.user.plan_id || 0,
      kv: String(data.user.kv ?? 0),
      city: address.city || "",
      address: address.address || "",
      password: "",
    });
  }, [data]);
  async function run(path, body) {
    try {
      await api(path, { method: "POST", body });
      setNote("Saved.");
      reload();
    } catch (err) {
      setNote(err.message);
    }
  }
  if (error) return <div className="error">{error}</div>;
  if (!data || !form) return <p>Loading...</p>;
  const user = data.user;
  return (
    <div>
      <h1 className="page-title">{user.fullname}</h1>
      <p className="muted">@{user.username} · {user.status ? "Active" : "Banned"} · {user.plan_name || "No package"}</p>
      {note && <div className="error">{note}</div>}
      <div className="mini-stats">
        <div className="card stat"><em>Balance</em><b>{money(user.balance)}</b></div>
        <div className="card stat"><em>Deposits</em><b>{money(data.totals.deposits)}</b></div>
        <div className="card stat"><em>Withdrawals</em><b>{money(data.totals.withdrawals)}</b></div>
        <div className="card stat"><em>Team</em><b>{data.totals.team}</b></div>
      </div>
      <div className="detail-grid">
        <section className="card">
          <h3>Payment screenshot</h3>
          {data.payment ? (
            <>
              <div className="kv"><span>Gateway</span><b>{data.payment.gateway || "—"}</b></div>
              <div className="kv"><span>Amount</span><b>{money(data.payment.amount)}</b></div>
              <div className="kv"><span>TRX</span><b>{data.payment.trx}</b></div>
              <div className="kv"><span>Status</span><b>{statusLabel("deposit", Number(data.payment.status))}</b></div>
              <Proofs proofs={data.payment.proofs} />
              <Link className="btn btn-line" to={`/admin/deposits/${data.payment.id}`}>Open payment</Link>
            </>
          ) : <p className="muted">No payment found for this user.</p>}
        </section>
        <form className="card" onSubmit={(event) => { event.preventDefault(); run(`/admin/users/${id}/`, form); }}>
          <h3>Account</h3>
          <div className="field-row">
            <label className="field"><span>First name</span><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
            <label className="field"><span>Last name</span><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
          </div>
          <label className="field"><span>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Mobile</span><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
          <label className="field"><span>Upline</span><input readOnly value={user.upline ? `@${user.upline.username}` : "Direct registration"} /></label>
          <label className="field"><span>Plan</span>
            <select value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}>
              <option value="0">No package</option>
              {(data.plans || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price)}</option>)}
            </select>
          </label>
          <label className="field"><span>KYC</span>
            <select value={form.kv} onChange={(e) => setForm({ ...form, kv: e.target.value })}>
              <option value="0">Unverified</option>
              <option value="2">Pending</option>
              <option value="1">Verified</option>
            </select>
          </label>
          <label className="field"><span>City</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label className="field"><span>Address</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <label className="field"><span>New password</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep" /></label>
          <div className="btn-row">
            <button className="btn btn-orange" type="submit">Save user</button>
            <button className="btn btn-line" type="button" onClick={() => run(`/admin/users/${id}/status/`, { ban_reason: user.status ? "Banned by admin" : "" })}>{user.status ? "Ban" : "Unban"}</button>
          </div>
        </form>
      </div>
      <form className="card" onSubmit={(event) => { event.preventDefault(); run(`/admin/users/${id}/balance/`, { amount, action: event.nativeEvent.submitter?.value || "add", wallet, remark }); }}>
        <h3>Balance</h3>
        <div className="field-row">
          <label className="field"><span>Amount</span><input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="field"><span>Wallet</span>
            <select value={wallet} onChange={(e) => setWallet(e.target.value)}>
              <option value="balance">Withdrawable</option>
              <option value="fanta">Bonus wallet</option>
            </select>
          </label>
        </div>
        <label className="field"><span>Note</span><input value={remark} onChange={(e) => setRemark(e.target.value)} /></label>
        <div className="btn-row">
          <button className="btn btn-blue" name="action" value="add" type="submit">Add</button>
          <button className="btn btn-line" name="action" value="sub" type="submit">Subtract</button>
        </div>
      </form>
      <section className="card table-wrap">
        <h3>Payments</h3>
        <table>
          <thead><tr><th>TRX</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data.deposits || []).map((row) => (
              <tr key={row.id}><td>{row.trx}</td><td>{money(row.amount)}</td><td>{statusLabel("deposit", Number(row.status))}</td><td><Link to={`/admin/deposits/${row.id}`}>View</Link></td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card table-wrap">
        <h3>Approved team ({data.totals.team})</h3>
        <table>
          <thead><tr><th>User</th><th>Plan</th><th>Balance</th><th></th></tr></thead>
          <tbody>
            {(data.team || []).map((row) => (
              <tr key={row.id}><td>@{row.username}</td><td>{row.plan_name || "—"}</td><td>{money(row.balance)}</td><td><Link to={`/admin/users/${row.id}`}>Details</Link></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export function AdminDeposits() {
  return <MoneyList kind="deposit" />;
}
export function AdminWithdrawals() {
  return <MoneyList kind="withdraw" />;
}
function MoneyList({ kind }) {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");
  const status = params.get("status") || "";
  const today = params.get("today") || "";
  const search = params.toString();
  const base = kind === "deposit" ? "/admin/deposits/" : "/admin/withdrawals/";
  const { data, error } = useLoad(`${base}${search ? `?${search}` : ""}`);
  const rows = data?.rows || [];
  const title = moneyTitle(kind, status, today);
  const filters = kind === "deposit"
    ? [["", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["initiated", "Initiated"]]
    : [["", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]];
  function submit(event) {
    event.preventDefault();
    setParams(writeParams(params, { q: query.trim(), from, to, today: "" }));
  }
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      {error && <div className="error">{error}</div>}
      {data?.summary && (
        <div className="mini-stats">
          {Object.entries(data.summary).map(([key, value]) => (
            <button key={key} type="button" className="card stat stat-link" onClick={() => setParams(writeParams(params, { status: key === "initiated" ? "initiated" : key, today: "" }))}>
              <em>{key}</em><b>{money(value)}</b>
            </button>
          ))}
        </div>
      )}
      <div className="filters">
        {filters.map(([id, label]) => (
          <button key={label} type="button" className={(status || "") === id && !today ? "btn btn-orange" : "btn btn-line"} onClick={() => setParams(writeParams(params, { status: id, today: "" }))}>{label}</button>
        ))}
        <button type="button" className={today ? "btn btn-orange" : "btn btn-line"} onClick={() => { setFrom(""); setTo(""); setParams(writeParams(params, { status: "approved", today: today ? "" : "1", from: "", to: "" })); }}>Today</button>
      </div>
      <form className="search-row" onSubmit={submit}>
        <label className="field"><span>Search username, email, TRX or phone</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payments" /></label>
        <label className="field"><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="field"><span>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="btn btn-orange" type="submit">Search</button>
      </form>
      <p className="muted">{data ? `${rows.length} shown${data.total > rows.length ? ` of ${data.total}` : ""}` : "Loading..."}</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Gateway / TRX</th><th>User</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.gateway || row.method || "—"}<div className="muted">{row.trx}</div></td>
                <td><Link to={`/admin/users/${row.user_id}`}>{row.fullname || row.username}</Link><div className="muted">@{row.username}{row.upline ? ` · upline @${row.upline}` : ""}</div></td>
                <td>{money(row.amount)}<div className="muted">{when(row.created_at)}</div></td>
                <td><span className={tone(kind, row.status)}>{statusLabel(kind, Number(row.status))}</span></td>
                <td><Link className="btn btn-line" to={`${kind === "deposit" ? "/admin/deposits/" : "/admin/withdrawals/"}${row.id}`}>View</Link></td>
              </tr>
            ))}
            {data && rows.length === 0 && <tr><td colSpan="5">No payments match this search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function moneyTitle(kind, status, today) {
  if (kind === "deposit" && status === "pending") return "New user request";
  if (kind === "deposit" && status === "rejected") return "Rejected users";
  if (kind === "deposit" && status === "approved" && today) return "Today approved users";
  if (kind === "deposit" && status === "approved") return "Approved payments";
  if (kind === "withdraw" && status === "pending") return "Withdrawal request";
  if (kind === "withdraw" && status === "approved" && today) return "Today approved withdrawals";
  if (kind === "withdraw" && status === "rejected") return "Rejected withdrawals";
  return kind === "deposit" ? "All deposits" : "All withdrawals";
}

export function AdminDeposit() {
  return <MoneyDetail kind="deposit" />;
}
export function AdminWithdrawal() {
  return <MoneyDetail kind="withdraw" />;
}
function MoneyDetail({ kind }) {
  const { id } = useParams();
  const base = kind === "deposit" ? `/admin/deposits/${id}/` : `/admin/withdrawals/${id}/`;
  const { data, error, reload } = useLoad(base);
  const [message, setMessage] = useState("");
  const [planId, setPlanId] = useState("");
  const [note, setNote] = useState("");
  async function act(action) {
    if (action === "reject" && !message.trim()) {
      setNote("Write a rejection message first.");
      return;
    }
    try {
      await api(base, { method: "POST", body: { action, message, plan_id: action === "approve" ? planId || undefined : undefined } });
      setNote(action === "approve" ? "Approved." : "Rejected.");
      reload();
    } catch (err) {
      setNote(err.message);
    }
  }
  if (error) return <div className="error">{error}</div>;
  if (!data) return <p>Loading...</p>;
  const proofs = data.proofs || data.information || [];
  return (
    <div>
      <h1 className="page-title">{data.username} · {money(data.amount)}</h1>
      {note && <div className="error">{note}</div>}
      <div className="detail-grid">
        <section className="card">
          <h3>{kind === "deposit" ? "Deposit" : "Withdrawal"}</h3>
          <div className="kv"><span>Date</span><b>{when(data.created_at)}</b></div>
          <div className="kv"><span>TRX</span><b>{data.trx}</b></div>
          <div className="kv"><span>User</span><b><Link to={`/admin/users/${data.user_id}`}>@{data.username}</Link></b></div>
          <div className="kv"><span>Name</span><b>{data.fullname}</b></div>
          <div className="kv"><span>Email</span><b>{data.email}</b></div>
          <div className="kv"><span>Mobile</span><b>{data.mobile || "—"}</b></div>
          <div className="kv"><span>Upline</span><b>{data.upline ? <Link to={`/admin/users/${data.upline_id}`}>@{data.upline}</Link> : "Direct"}</b></div>
          <div className="kv"><span>Method</span><b>{data.gateway || data.method || "—"}</b></div>
          <div className="kv"><span>Amount</span><b>{money(data.amount)}</b></div>
          <div className="kv"><span>Charge</span><b>{money(data.charge)}</b></div>
          <div className="kv"><span>Payable</span><b>{money(data.final_amo || data.final_amount)} {data.method_currency || data.currency || ""}</b></div>
          <div className="kv"><span>Status</span><b><span className={tone(kind, data.status)}>{statusLabel(kind, Number(data.status))}</span></b></div>
          {data.admin_feedback && <p>{data.admin_feedback}</p>}
        </section>
        <section className="card">
          <h3>Payment details</h3>
          <Proofs proofs={proofs} />
          {Number(data.status) === 2 && (
            <>
              {kind === "deposit" && (
                <label className="field"><span>Approve as plan</span>
                  <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                    <option value="">Keep requested amount</option>
                    {(data.plans || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price)}</option>)}
                  </select>
                </label>
              )}
              <label className="field"><span>Message</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Required when rejecting" /></label>
              <div className="btn-row">
                <button className="btn btn-orange" type="button" onClick={() => act("approve")}>Approve</button>
                <button className="btn btn-line" type="button" onClick={() => act("reject")}>Reject</button>
              </div>
            </>
          )}
          {kind === "deposit" && Number(data.status) === 3 && (
            <button className="btn btn-orange" type="button" onClick={() => act("approve")}>Approve anyway</button>
          )}
        </section>
      </div>
    </div>
  );
}

export function AdminPlans() {
  const { data, reload } = useLoad("/admin/plans/");
  return (
    <div>
      <h1 className="page-title">Plans</h1>
      <div className="cards-2">
        {(data || []).map((plan) => <PlanEditor key={plan.id} plan={plan} onSave={reload} />)}
      </div>
    </div>
  );
}
function PlanEditor({ plan, onSave }) {
  const [form, setForm] = useState(plan);
  async function save(event) {
    event.preventDefault();
    await api("/admin/plans/", { method: "POST", body: form });
    onSave();
  }
  return (
    <form className="card" onSubmit={save}>
      <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="field"><span>Price</span><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
      <label className="field"><span>Daily tasks</span><input value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} /></label>
      <button className="btn btn-orange">Save</button>
    </form>
  );
}

export function AdminAds() {
  const { data, reload } = useLoad("/admin/ads/");
  const [form, setForm] = useState({ title: "", ads_body: "", duration: 15, remain: 1000 });
  async function save(event) {
    event.preventDefault();
    await api("/admin/ads/", { method: "POST", body: form });
    reload();
  }
  return (
    <div>
      <h1 className="page-title">PTC ads</h1>
      <form className="card" onSubmit={save}>
        <label className="field"><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className="field"><span>Link</span><input value={form.ads_body} onChange={(e) => setForm({ ...form, ads_body: e.target.value })} /></label>
        <button className="btn btn-orange">Add task</button>
      </form>
      <div className="card">{(data || []).map((ad) => <div className="task" key={ad.id}><div><strong>{ad.title}</strong><div className="muted">{ad.ads_body}</div></div><span className="badge">{ad.status === 1 ? "Active" : ad.status}</span></div>)}</div>
    </div>
  );
}

export function AdminTickets() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const status = params.get("status") || "";
  const search = params.toString();
  const { data, error } = useLoad(`/admin/tickets/${search ? `?${search}` : ""}`);
  const rows = data?.rows || [];
  function submit(event) {
    event.preventDefault();
    setParams(writeParams(params, { q: query.trim() }));
  }
  return (
    <div>
      <h1 className="page-title">Tickets</h1>
      {error && <div className="error">{error}</div>}
      <div className="filters">
        {[["", "All"], ["open", "Open"], ["answered", "Answered"], ["customer", "Customer reply"], ["closed", "Closed"]].map(([id, label]) => (
          <button key={label} type="button" className={status === id ? "btn btn-orange" : "btn btn-line"} onClick={() => setParams(writeParams(params, { status: id }))}>{label}</button>
        ))}
      </div>
      <form className="search-row" onSubmit={submit}>
        <label className="field"><span>Search subject, email or ticket</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" /></label>
        <button className="btn btn-orange" type="submit">Search</button>
      </form>
      <div className="card">{rows.map((row) => <Link className="task" key={row.id} to={`/admin/tickets/${row.id}`}><strong>{row.subject}</strong><span>{row.status_label}</span></Link>)}</div>
    </div>
  );
}
export function AdminTicket() {
  const { id } = useParams();
  const { data, reload } = useLoad(`/admin/tickets/${id}/`);
  const [message, setMessage] = useState("");
  async function reply(event) {
    event.preventDefault();
    await api(`/admin/tickets/${id}/`, { method: "POST", body: { message } });
    setMessage("");
    reload();
  }
  if (!data) return <p>Loading...</p>;
  return (
    <div className="card">
      <h1 className="page-title">{data.subject}</h1>
      {(data.messages || []).map((item) => <p key={item.id}><strong>{item.admin ? "Admin" : "User"}:</strong> {item.message}</p>)}
      <form onSubmit={reply}>
        <label className="field"><span>Reply</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <button className="btn btn-orange">Send</button>
      </form>
    </div>
  );
}

export function AdminReferrals() {
  const { data, reload } = useLoad("/admin/referrals/");
  return (
    <div>
      <h1 className="page-title">Referral rates</h1>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Level</th><th>Percent</th></tr></thead>
          <tbody>{(data || []).map((row) => <tr key={row.id}><td>{row.commission_type}</td><td>{row.level}</td><td>{row.percent}</td></tr>)}</tbody>
        </table>
      </div>
      <RateForm onSave={reload} />
    </div>
  );
}
function RateForm({ onSave }) {
  const [form, setForm] = useState({ commission_type: "ptc_view_commission", level: 1, percent: 5 });
  async function save(event) {
    event.preventDefault();
    await api("/admin/referrals/", { method: "POST", body: form });
    onSave();
  }
  return (
    <form className="card" onSubmit={save}>
      <label className="field"><span>Type</span><input value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })} /></label>
      <label className="field"><span>Level</span><input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></label>
      <label className="field"><span>Percent</span><input value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} /></label>
      <button className="btn btn-orange">Save rate</button>
    </form>
  );
}

export function AdminKyc() {
  const { data, reload } = useLoad("/admin/kyc/");
  async function act(id, action) {
    await api(`/admin/kyc/${id}/`, { method: "POST", body: { action } });
    reload();
  }
  return (
    <div>
      <h1 className="page-title">KYC review</h1>
      <div className="card">
        {(data || []).length === 0 && <p>No pending KYC.</p>}
        {(data || []).map((user) => (
          <div className="task" key={user.id}>
            <div>
              <strong>{user.username}</strong>
              <div className="muted">{user.email}</div>
              {(user.proofs || []).map((proof) => (
                <div key={proof.name}>{proof.name}: {proof.url ? <a href={proof.url} target="_blank" rel="noreferrer">Open file</a> : proof.value}</div>
              ))}
            </div>
            <div className="btn-row">
              <button className="btn btn-orange" onClick={() => act(user.id, "approve")}>Approve</button>
              <button className="btn btn-line" onClick={() => act(user.id, "reject")}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminReports() {
  const [params, setParams] = useSearchParams();
  const type = params.get("type") || "transactions";
  const [query, setQuery] = useState(params.get("q") || "");
  const { data, error } = useLoad(`/admin/reports/?type=${type}${params.get("q") ? `&q=${encodeURIComponent(params.get("q"))}` : ""}`);
  const rows = data?.rows || [];
  const types = [["transactions", "Transactions"], ["commissions", "Commissions"], ["logins", "Logins"], ["ptc", "Task views"], ["manual", "Manual balance"]];
  function submit(event) {
    event.preventDefault();
    setParams(writeParams(params, { type, q: query.trim() }));
  }
  return (
    <div>
      <h1 className="page-title">Reports</h1>
      {error && <div className="error">{error}</div>}
      <div className="filters">
        {types.map(([id, label]) => (
          <button key={id} type="button" className={type === id ? "btn btn-orange" : "btn btn-line"} onClick={() => setParams(writeParams(params, { type: id }))}>{label}</button>
        ))}
      </div>
      <form className="search-row" onSubmit={submit}>
        <label className="field"><span>Search username, email, TRX or details</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search report" /></label>
        <button className="btn btn-orange" type="submit">Search</button>
      </form>
      <p className="muted">{data ? `${rows.length} shown${data.total > rows.length ? ` of ${data.total}` : ""}` : "Loading..."}</p>
      <div className="card table-wrap">
        <table>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.username || row.to || row.title || row.details || row.ip}</td>
                <td>{row.amount ? money(row.amount) : row.browser || row.from || row.trx_type || ""}{row.details ? <div className="muted">{row.details}</div> : null}</td>
                <td>{when(row.created_at)}</td>
              </tr>
            ))}
            {data && rows.length === 0 && <tr><td>No rows match this search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminMethods() {
  const { data, reload } = useLoad("/admin/withdraw-methods/");
  async function toggle(row) {
    await api("/admin/withdraw-methods/", { method: "POST", body: { id: row.id, status: row.status ? 0 : 1 } });
    reload();
  }
  return (
    <div>
      <h1 className="page-title">Withdraw methods</h1>
      <div className="card">
        {(data || []).map((row) => (
          <div className="task" key={row.id}>
            <div><strong>{row.name}</strong><div className="muted">{money(row.min_limit)} – {money(row.max_limit)}</div></div>
            <button className="btn btn-line" onClick={() => toggle(row)}>{row.status ? "Disable" : "Enable"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { data, reload } = useLoad("/admin/settings/");
  const [form, setForm] = useState(null);
  useEffect(() => { if (data) setForm(data); }, [data]);
  async function save(event) {
    event.preventDefault();
    await api("/admin/settings/", { method: "POST", body: form });
    reload();
  }
  if (!form) return <p>Loading...</p>;
  const toggles = [
    ["user_ads_post", "Users can post ads"],
    ["ad_auto_approve", "Auto approve ads"],
    ["deposit_commission", "Deposit commission"],
    ["ptc_view_commission", "Task view commission"],
    ["auto_commission", "Credit commission immediately"],
  ];
  return (
    <form className="card" style={{ maxWidth: 640 }} onSubmit={save}>
      <h1 className="page-title">Settings</h1>
      <label className="field"><span>Site name</span><input value={form.site_name || ""} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></label>
      <label className="field"><span>Currency symbol</span><input value={form.cur_sym || ""} onChange={(e) => setForm({ ...form, cur_sym: e.target.value })} /></label>
      {toggles.map(([key, label]) => (
        <label className="field" key={key}><span>{label}</span>
          <select value={form[key] ? "1" : "0"} onChange={(e) => setForm({ ...form, [key]: e.target.value === "1" ? 1 : 0 })}>
            <option value="1">On</option>
            <option value="0">Off</option>
          </select>
        </label>
      ))}
      <button className="btn btn-orange">Save</button>
    </form>
  );
}

export function AdminGateways() {
  const { data, error, reload } = useLoad("/admin/gateways/");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const rows = (data || []).filter((row) => {
    const text = `${row.name} ${row.alias} ${row.currency}`.toLowerCase();
    return !query.trim() || text.includes(query.trim().toLowerCase());
  });
  const manual = rows.filter((row) => row.manual);
  const list = manual.length ? manual : rows;
  async function toggle(row) {
    try {
      await api("/admin/gateways/", { method: "POST", body: { id: row.id, status: row.status ? 0 : 1 } });
      setNote("");
      reload();
    } catch (err) {
      setNote(err.message);
    }
  }
  return (
    <div>
      <h1 className="page-title">Easypaisa & JazzCash</h1>
      {error && <div className="error">{error}</div>}
      {note && <div className="error">{note}</div>}
      <form className="search-row" onSubmit={(event) => event.preventDefault()}>
        <label className="field"><span>Search gateway</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Easypaisa, JazzCash" /></label>
      </form>
      <div className="card">
        {list.map((row) => (
          <div className="task" key={row.id}>
            <div>
              <strong>{row.name}</strong>
              <div className="muted">{row.currency || "PKR"} · {money(row.min_amount)} – {money(row.max_amount)} · rate {row.rate}</div>
            </div>
            <button className="btn btn-line" type="button" onClick={() => toggle(row)}>{row.status ? "Disable" : "Enable"}</button>
          </div>
        ))}
        {data && list.length === 0 && <p>No gateways found.</p>}
      </div>
    </div>
  );
}

export function AdminLevels() {
  const { data, error, reload } = useLoad("/admin/levels/");
  const [planId, setPlanId] = useState("");
  const [levels, setLevels] = useState([]);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!data?.length) return;
    const current = data.find((plan) => String(plan.id) === String(planId)) || data[0];
    if (!planId) setPlanId(String(current.id));
    if (String(current.id) === String(planId || current.id)) setLevels(current.levels.map((row) => ({ ...row })));
  }, [data, planId]);
  function update(index, key, value) {
    setLevels(levels.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }
  async function save(event) {
    event.preventDefault();
    try {
      await api("/admin/levels/", { method: "POST", body: { plan_id: planId, levels } });
      setNote("Levels saved.");
      reload();
    } catch (err) {
      setNote(err.message);
    }
  }
  if (error) return <div className="error">{error}</div>;
  if (!data) return <p>Loading...</p>;
  return (
    <form className="card" onSubmit={save}>
      <h1 className="page-title">Levels setting</h1>
      {note && <div className="error">{note}</div>}
      <label className="field"><span>Plan</span>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {data.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </select>
      </label>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Level</th><th>Referrals required</th><th>Daily clicks</th><th></th></tr></thead>
          <tbody>
            {levels.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td><input value={row.referrals_required} onChange={(e) => update(index, "referrals_required", e.target.value)} /></td>
                <td><input value={row.daily_limit} onChange={(e) => update(index, "daily_limit", e.target.value)} /></td>
                <td><button className="btn btn-line" type="button" onClick={() => setLevels(levels.filter((_, i) => i !== index))}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="btn-row">
        <button className="btn btn-line" type="button" onClick={() => setLevels([...levels, { referrals_required: 0, daily_limit: 1 }])}>Add level</button>
        <button className="btn btn-orange" type="submit">Save levels</button>
      </div>
    </form>
  );
}

export function AdminLinks() {
  return null;
}
