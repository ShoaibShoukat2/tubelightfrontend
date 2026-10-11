const shapes = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M10 9.2v5.6l4.6-2.8L10 9.2z" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 20 8l-8 4.5L4 8l8-4.5z" />
      <path d="M4 12l8 4.5L20 12" />
      <path d="M4 16l8 4.5L20 16" />
    </>
  ),
  ads: (
    <>
      <path d="M4 10v4h3l5 3V7L7 10H4z" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M17.8 7.2a6.5 6.5 0 0 1 0 9.6" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="12.5" rx="2.2" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14.2" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  down: (
    <>
      <path d="M12 4v12" />
      <path d="M7 12l5 5 5-5" />
      <path d="M6 20h12" />
    </>
  ),
  up: (
    <>
      <path d="M12 20V8" />
      <path d="M7 12l5-5 5 5" />
      <path d="M6 4h12" />
    </>
  ),
  list: (
    <>
      <path d="M8 7h12M8 12h12M8 17h12" />
      <circle cx="4.5" cy="7" r=".8" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r=".8" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v4c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M5 11v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
    </>
  ),
  percent: (
    <>
      <path d="M7 17 17 7" />
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="16" r="2" />
    </>
  ),
  swap: (
    <>
      <path d="M7 7h11l-3-3" />
      <path d="M17 17H6l3 3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.8 18.5c.8-2.6 2.8-4 5.2-4s4.4 1.4 5.2 4" />
      <circle cx="17" cy="9.5" r="2.3" />
      <path d="M16.2 14.6c1.8.3 3.2 1.5 3.9 3.4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="1.6" />
      <path d="M4 15h16M12 11v9" />
      <path d="M12 11c-2.2 0-4-1.4-4-3.1S9.2 5 12 8c2.8-3 4-1.2 4-.1S14.2 11 12 11z" />
    </>
  ),
  life: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.75V9M12 15v5.25M3.75 12H9M15 12h5.25" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 8H19" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m14.8 9.2-1.3 4.3-4.3 1.3 1.3-4.3 4.3-1.3z" />
    </>
  ),
  chat: (
    <>
      <path d="M6 16.5 4 19V7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H8z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6.5v5.2c0 4-2.8 6.7-7 8.3-4.2-1.6-7-4.3-7-8.3V6.5L12 3.5z" />
      <path d="M9 12.1 11 14l4-4.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 19c1.1-3 3.3-4.5 6.5-4.5s5.4 1.5 6.5 4.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  logout: (
    <>
      <path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" />
      <path d="M4 12h10" />
      <path d="M11 9l3 3-3 3" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M7 10.5V20h10v-9.5" />
    </>
  ),
};

export function Icon({ name }) {
  return (
    <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {shapes[name] || shapes.grid}
    </svg>
  );
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "T";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
