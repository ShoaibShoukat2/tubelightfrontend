import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    ["/admin/users", "Active", data.active_users, "Can log in"],
    ["/admin/deposits", "Deposits", data.pending_deposits, "Waiting approval"],
    ["/admin/withdrawals", "Withdrawals", data.pending_withdrawals, "Waiting payout"],
    ["/admin/tickets", "Tickets", data.open_tickets, "Need a reply"],
    ["/admin/users", "Balances", money(data.total_balance), "User wallets"],
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
            <Action to="/admin/deposits" title="Deposits" text="Approve payments" />
            <Action to="/admin/withdrawals" title="Withdrawals" text="Pay requests" />
            <Action to="/admin/users" title="Users" text="Balances" />
            <Action to="/admin/kyc" title="KYC" text="Review IDs" />
          </div>
        </section>
      </div>
    </div>
  );
}
function Action({ to, title, text }) {
  return <Link className="action" to={to}><strong>{title}</strong><span>{text}</span></Link>;
}

export function AdminUsers() {
  const [query, setQuery] = useState("");
  const { data, reload } = useLoad(`/admin/users/${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const [amount, setAmount] = useState("100");
  const [wallet, setWallet] = useState("balance");
  async function act(id, path, body) {
    await api(path, { method: "POST", body });
    reload();
  }
  return (
    <div>
      <h1 className="page-title">Users</h1>
      <label className="field"><span>Search</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="username, email, mobile" /></label>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>User</th><th>Balance</th><th>Plan</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data || []).map((user) => (
              <tr key={user.id}>
                <td>{user.username}<div className="muted">{user.email}</div></td>
                <td>{money(user.balance)}</td>
                <td>{user.plan_name || "—"}</td>
                <td>{user.status ? "Active" : "Banned"}</td>
                <td>
                  <button className="btn btn-line" onClick={() => act(user.id, `/admin/users/${user.id}/status/`, {})}>{user.status ? "Ban" : "Unban"}</button>
                  <button className="btn btn-blue" onClick={() => act(user.id, `/admin/users/${user.id}/balance/`, { amount, action: "add", wallet })}>Add</button>
                  <button className="btn btn-line" onClick={() => act(user.id, `/admin/users/${user.id}/balance/`, { amount, action: "sub", wallet })}>Subtract</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <label className="field"><span>Amount</span><input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label className="field"><span>Wallet</span>
          <select value={wallet} onChange={(e) => setWallet(e.target.value)}>
            <option value="balance">Withdrawable</option>
            <option value="fanta">Bonus wallet</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function AdminDeposits() {
  const { data, reload } = useLoad("/admin/deposits/");
  async function act(id, action) {
    await api(`/admin/deposits/${id}/`, { method: "POST", body: { action, message: "Rejected by admin" } });
    reload();
  }
  return <AdminMoney title="Deposits" rows={data} kind="deposit" onAct={act} />;
}
export function AdminWithdrawals() {
  const { data, reload } = useLoad("/admin/withdrawals/");
  async function act(id, action) {
    await api(`/admin/withdrawals/${id}/`, { method: "POST", body: { action, message: "Rejected by admin" } });
    reload();
  }
  return <AdminMoney title="Withdrawals" rows={data} kind="withdraw" onAct={act} />;
}
function AdminMoney({ title, rows, kind, onAct }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(rows || []).map((row) => (
              <tr key={row.id}>
                <td>{row.username}<div className="muted">{row.trx}</div></td>
                <td>{money(row.amount)}{(row.proofs || []).map((proof) => (
                  <div key={proof.name} className="muted">
                    {proof.name}: {proof.url ? <a href={proof.url} target="_blank" rel="noreferrer">{proof.type === "file" ? "Open file" : proof.value}</a> : proof.value}
                  </div>
                ))}</td>
                <td>{statusLabel(kind, Number(row.status))}</td>
                <td>
                  {Number(row.status) === 2 && (
                    <>
                      <button className="btn btn-orange" onClick={() => onAct(row.id, "approve")}>Approve</button>
                      <button className="btn btn-line" onClick={() => onAct(row.id, "reject")}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const { data } = useLoad("/admin/tickets/");
  return (
    <div>
      <h1 className="page-title">Tickets</h1>
      <div className="card">{(data || []).map((row) => <Link className="task" key={row.id} to={`/admin/tickets/${row.id}`}><strong>{row.subject}</strong><span>{row.status_label}</span></Link>)}</div>
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
  const [type, setType] = useState("transactions");
  const { data } = useLoad(`/admin/reports/?type=${type}`);
  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <div className="btn-row">
        {["transactions", "commissions", "logins"].map((item) => (
          <button key={item} className={item === type ? "btn btn-orange" : "btn btn-line"} onClick={() => setType(item)}>{item}</button>
        ))}
      </div>
      <div className="card table-wrap">
        <table>
          <tbody>
            {(data || []).map((row) => (
              <tr key={row.id}>
                <td>{row.username || row.to || row.details || row.ip}</td>
                <td>{row.amount ? money(row.amount) : row.browser || row.from || row.trx_type}</td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString() : ""}</td>
              </tr>
            ))}
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

export function AdminLinks() {
  return null;
}
