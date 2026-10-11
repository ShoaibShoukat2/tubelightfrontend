import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, clearSession, getToken, money, role } from "./api";
import { Icon, initials } from "./icons";
import { Forgot, Home, Login, Register } from "./public";
import {
  Ads, Commissions, Dashboard, Deposit, Deposits, Earnings, Feedback, Guide, Kyc, NewTicket,
  Password, Pending, Plans, Profile, Rewards, Rules, Support, Tasks, Team,
  TicketView, Transactions, Transfer, Wallet, WatchTask, Withdraw, Withdrawals,
} from "./user";
import {
  AdminAds, AdminDeposits, AdminHome, AdminKyc, AdminLogin, AdminMethods, AdminPlans, AdminReferrals,
  AdminReports, AdminSettings, AdminTicket, AdminTickets, AdminUsers, AdminWithdrawals,
} from "./admin";

const groups = [
  ["Work", [
    ["/app", "Dashboard", "grid"],
    ["/app/tasks", "Tasks", "play"],
    ["/app/plans", "Plans", "layers"],
    ["/app/ads", "My ads", "ads"],
  ]],
  ["Money", [
    ["/app/wallet", "Wallet", "wallet"],
    ["/app/deposit", "Deposit", "down"],
    ["/app/withdraw", "Withdraw", "up"],
    ["/app/transactions", "Transactions", "list"],
    ["/app/earnings", "Earnings", "coins"],
    ["/app/commissions", "Commissions", "percent"],
    ["/app/transfer", "Transfer", "swap"],
  ]],
  ["Team", [
    ["/app/team", "Team", "users"],
    ["/app/rewards", "Rewards", "gift"],
  ]],
  ["Help", [
    ["/app/support", "Support", "life"],
    ["/app/rules", "Rules", "book"],
    ["/app/guide", "Guide", "compass"],
    ["/app/feedback", "Feedback", "chat"],
  ]],
  ["Account", [
    ["/app/kyc", "KYC", "shield"],
    ["/app/profile", "Profile", "user"],
    ["/app/password", "Password", "lock"],
  ]],
];

const adminGroups = [
  ["Overview", [
    ["/admin/home", "Dashboard", "grid"],
    ["/admin/reports", "Reports", "list"],
  ]],
  ["People", [
    ["/admin/users", "Users", "users"],
    ["/admin/kyc", "KYC", "shield"],
    ["/admin/referrals", "Referrals", "percent"],
  ]],
  ["Money", [
    ["/admin/deposits", "Deposits", "down"],
    ["/admin/withdrawals", "Withdrawals", "up"],
    ["/admin/methods", "Methods", "wallet"],
  ]],
  ["Site", [
    ["/admin/plans", "Plans", "layers"],
    ["/admin/ads", "Ads", "ads"],
    ["/admin/tickets", "Tickets", "life"],
    ["/admin/settings", "Settings", "lock"],
  ]],
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/ref/:code" element={<RefRedirect />} />
      <Route element={<UserShell />}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/tasks" element={<Tasks />} />
        <Route path="/app/tasks/:id" element={<WatchTask />} />
        <Route path="/app/plans" element={<Plans />} />
        <Route path="/app/wallet" element={<Wallet />} />
        <Route path="/app/deposit" element={<Deposit />} />
        <Route path="/app/deposits" element={<Deposits />} />
        <Route path="/app/withdraw" element={<Withdraw />} />
        <Route path="/app/withdrawals" element={<Withdrawals />} />
        <Route path="/app/transactions" element={<Transactions />} />
        <Route path="/app/earnings" element={<Earnings />} />
        <Route path="/app/commissions" element={<Commissions />} />
        <Route path="/app/team" element={<Team />} />
        <Route path="/app/rewards" element={<Rewards />} />
        <Route path="/app/transfer" element={<Transfer />} />
        <Route path="/app/ads" element={<Ads />} />
        <Route path="/app/support" element={<Support />} />
        <Route path="/app/support/new" element={<NewTicket />} />
        <Route path="/app/support/:ticket" element={<TicketView />} />
        <Route path="/app/rules" element={<Rules />} />
        <Route path="/app/guide" element={<Guide />} />
        <Route path="/app/kyc" element={<Kyc />} />
        <Route path="/app/feedback" element={<Feedback />} />
        <Route path="/app/profile" element={<Profile />} />
        <Route path="/app/password" element={<Password />} />
        <Route path="/app/pending" element={<Pending />} />
      </Route>
      <Route path="/admin" element={<AdminLogin />} />
      <Route element={<AdminShell />}>
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/deposits" element={<AdminDeposits />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/ads" element={<AdminAds />} />
        <Route path="/admin/tickets" element={<AdminTickets />} />
        <Route path="/admin/tickets/:id" element={<AdminTicket />} />
        <Route path="/admin/referrals" element={<AdminReferrals />} />
        <Route path="/admin/kyc" element={<AdminKyc />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/methods" element={<AdminMethods />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

function RefRedirect() {
  const { code } = useParams();
  return <Navigate to={`/register?ref=${code || ""}`} replace />;
}

function UserShell() {
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken() || role() !== "user") {
      navigate("/login");
      return;
    }
    api("/auth/me/").then(setMe).catch(() => navigate("/login"));
  }, [navigate]);
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!me) return <div className="boot">Loading account...</div>;
  return (
    <div className="shell">
      {open && <button className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`side ${open ? "open" : ""}`}>
        <div className="side-head">
          <Link className="brand" to="/app" onClick={() => setOpen(false)}><span className="brand-mark">T</span> TubeLight</Link>
          <button className="icon-btn side-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav onClick={() => setOpen(false)}>
          {groups.map(([title, items]) => (
            <div className="nav-group" key={title}>
              <div className="nav-label">{title}</div>
              {items.map(([to, label, icon]) => (
                <NavLink key={to} to={to} end={to === "/app"}>
                  <Icon name={icon} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="user-chip">
            <span className="avatar">{initials(me.fullname)}</span>
            <div>
              <strong>{me.fullname}</strong>
              <div className="muted">@{me.username}</div>
            </div>
          </div>
          <div className="chip-balance">{money(me.balance)}</div>
          <button className="linkish" onClick={() => { clearSession(); navigate("/login"); }}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <section className="main">
        <div className="topbar appbar">
          <button className="icon-btn menu-btn" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="appbar-id">
            <span className="avatar">{initials(me.fullname)}</span>
            <div>
              <strong>{me.fullname}</strong>
              <span>{money(me.balance)}</span>
            </div>
          </div>
          <div className="pills">
            <span className="balance-pill">{money(me.balance)}</span>
            <span className="balance-pill bonus">Bonus {money(me.fanta_balance)}</span>
          </div>
          <Link to="/app/tasks" className="btn btn-orange">Tasks</Link>
        </div>
        <Outlet />
      </section>
      <nav className="bottom-nav">
        <NavLink to="/app" end><Icon name="home" /><span>Home</span></NavLink>
        <NavLink to="/app/tasks"><Icon name="play" /><span>Tasks</span></NavLink>
        <NavLink to="/app/wallet"><Icon name="wallet" /><span>Wallet</span></NavLink>
        <NavLink to="/app/team"><Icon name="users" /><span>Team</span></NavLink>
        <button type="button" className={open ? "active" : ""} onClick={() => setOpen(true)}>
          <Icon name="menu" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

function AdminShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken() || role() !== "admin") navigate("/admin");
  }, [navigate]);
  return (
    <div className="shell">
      {open && <button className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`side ${open ? "open" : ""}`}>
        <div className="side-head">
          <Link className="brand" to="/admin/home" onClick={() => setOpen(false)}><span className="brand-mark">T</span> Admin</Link>
          <button className="icon-btn side-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav onClick={() => setOpen(false)}>
          {adminGroups.map(([title, items]) => (
            <div className="nav-group" key={title}>
              <div className="nav-label">{title}</div>
              {items.map(([to, label, icon]) => (
                <NavLink key={to} to={to}>
                  <Icon name={icon} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <button className="linkish" onClick={() => { clearSession(); navigate("/admin"); }}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <section className="main">
        <div className="topbar mobile-bar">
          <button className="icon-btn menu-btn" type="button" aria-label="Open menu" onClick={() => setOpen((v) => !v)}>
            <Icon name="menu" />
          </button>
          <strong>Admin</strong>
        </div>
        <Outlet />
      </section>
    </div>
  );
}
