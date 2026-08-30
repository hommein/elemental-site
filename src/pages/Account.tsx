import { useEffect, useRef, useState } from "react";
import { me, setUser, type User } from "../lib/user";
import { MyBookingsModal } from "./Classes";

const GOOGLE_CLIENT_ID = "119603995086-p8d32a3mlbm2cdl1e9h8bkrqe7vlnrbm.apps.googleusercontent.com";

function GoogleButton({ onSignedIn, onError }: { onSignedIn: () => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !ref.current) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: any) => {
          const r = await fetch("/api/auth/google", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ credential: resp.credential }),
          });
          const j = await r.json();
          if (!r.ok) { onError(j.error || "Google sign-in failed."); return; }
          onSignedIn();
        },
      });
      g.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 280, text: "continue_with" });
    };
    if ((window as any).google?.accounts?.id) { init(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, []);
  return <div ref={ref} className="flex justify-center" />;
}

export default function Account() {
  const [user, setU] = useState<User>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const [showBk, setShowBk] = useState(false);

  useEffect(() => { me().then(u => { setU(u); setLoaded(true); }); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "register" ? { name, email, password: pw, phone } : { email, password: pw }),
    });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(j.error || "Something went wrong."); return; }
    const u = await me(true); setU(u);
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setU(null);
  }

  return (
    <section className="container py-12 max-w-md">
      <h1 className="font-serif text-4xl mb-6">Account</h1>
      {!loaded ? <p>Loading…</p> : user ? (
        <div className="flex flex-col gap-4">
          <p>Signed in as <strong>{user.name}</strong> ({user.email}).</p>
          <p className="text-sm text-ea-espresso/70">
            Booking class sign-ups and open gym is now one click — your name and email are filled in
            automatically, and “My bookings” on the Classes page loads without asking.
          </p>
          <button className="btn btn--accent" onClick={() => setShowBk(true)}>📋 My Bookings</button>
          {showBk && <MyBookingsModal onClose={() => setShowBk(false)} />}
          <PhoneBox initial={user.phone || ""} />
          <PackBox />
          {user.is_admin && <a className="btn btn--accent text-center" href="/admin">Studio Admin</a>}
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3">
            <GoogleButton
              onSignedIn={async () => { const u = await me(true); setU(u); }}
              onError={m => setMsg(m)} />
            <div className="flex items-center gap-3 text-sm text-ea-espresso/50">
              <span className="h-px flex-1 bg-black/10" />or<span className="h-px flex-1 bg-black/10" />
            </div>
          </div>
          <div className="flex gap-2 mb-5">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg(""); }}
                className={`btn ${mode === m ? "btn--accent" : ""}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "register" &&
              <input required placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                className="border border-black/20 rounded-lg px-3 py-2" />}
            {mode === "register" &&
              <input type="tel" placeholder="Cell phone (for class reminders)" value={phone} onChange={e => setPhone(e.target.value)}
                className="border border-black/20 rounded-lg px-3 py-2" />}
            <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="border border-black/20 rounded-lg px-3 py-2" />
            <input required type="password" placeholder={mode === "register" ? "Password (8+ characters)" : "Password"}
              value={pw} onChange={e => setPw(e.target.value)} minLength={mode === "register" ? 8 : undefined}
              className="border border-black/20 rounded-lg px-3 py-2" />
            {msg && <p className="text-sm text-red-700">{msg}</p>}
            <button className="btn btn--accent" disabled={busy}>
              {busy ? "…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
          <p className="text-sm text-ea-espresso/60 mt-4">Google sign-in coming soon.</p>
        </>
      )}
    </section>
  );
}

function PackBox() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetch("/api/pack").then(r => r.json()).then(setD); }, []);
  if (!d) return null;
  const bal = d.balance; // canonical: SUM(remaining) across all packs, from the server
  const mu = d.member_until;
  const activeM = mu && mu >= new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10);
  return (
    <div className="border border-ea-accent/40 rounded p-4 text-sm">
      <h2 className="font-serif text-lg mb-1">Class Pack & Payments</h2>
      {mu && (activeM
        ? <p className="text-ea-olive font-semibold mb-1">Open Gym membership active through {mu} — open gym & Community Jam are covered.</p>
        : <p className="opacity-60 mb-1">Your Open Gym membership ended {mu}. Renew at the studio ($100/month).</p>)}
      {bal != null
        ? <p>You have <b>{bal}</b> classes left in your pack.{bal < 0 &&
            <span className="block text-sm text-ea-brown mt-1">A negative balance just means you booked ahead of a payment being recorded — settle up via Venmo below.</span>}</p>
        : <p>No class pack on file — pay per class, or ask at the studio about packs.</p>}
      {d.credit > 0 && <p className="mt-1">You also have <b>${d.credit.toFixed(2)}</b> unused credit on file — it's automatically applied when the studio records your bookings or next pack.</p>}
      {(d.payments || []).length > 0 &&
        <p className="opacity-70 mt-1">Last payment: ${d.payments[0].amount} ({d.payments[0].method}, {d.payments[0].date})</p>}
      <a className="btn btn--accent inline-block mt-3" target="_blank" rel="noreferrer"
         href="https://account.venmo.com/u/Katelyn-Carano">Pay with Venmo</a>
      <p className="opacity-70 mt-1">Please put exactly <b>“Aerial”</b> in the Venmo note. Cash also accepted at the studio.</p>
    </div>
  );
}

function PhoneBox({ initial }: { initial: string }) {
  const [phone, setPhone] = useState(initial);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const r = await fetch("/api/auth/phone", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
    setBusy(false); setSaved(r.ok ? "Saved!" : "Couldn't save — try again.");
    setTimeout(() => setSaved(null), 2500);
  }
  return (
    <div className="border border-ea-accent/40 rounded-lg p-4 bg-white">
      <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Cell phone</div>
      <div className="flex gap-2 items-center">
        <input type="tel" placeholder="(805) 555-1234" value={phone} onChange={e => setPhone(e.target.value)}
          className="border border-black/20 rounded-lg px-3 py-2 flex-1 min-w-0" />
        <button className="btn text-sm !px-4 !py-2" disabled={busy || phone === initial && !saved} onClick={save}>Save</button>
      </div>
      <p className="text-xs opacity-60 mt-1">{saved || "Used for class reminders and schedule updates by text."}</p>
    </div>
  );
}
