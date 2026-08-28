import { useEffect, useRef, useState } from "react";
import { me, setUser, type User } from "../lib/user";

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
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");

  useEffect(() => { me().then(u => { setU(u); setLoaded(true); }); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "register" ? { name, email, password: pw } : { email, password: pw }),
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
          {user.cal_token && (
            <div className="border border-black/10 rounded-xl p-4 flex flex-col gap-2">
              <h2 className="font-serif text-xl">Calendar sync</h2>
              <p className="text-sm text-ea-espresso/70">
                Subscribe to this private feed in Google Calendar (“Other calendars → From URL”),
                Apple Calendar, or Outlook — your bookings will appear automatically and stay in sync.
              </p>
              <code className="text-xs bg-black/5 rounded px-2 py-1.5 break-all select-all">
                {`${location.origin}/api/calendar/${user.cal_token}.ics`}
              </code>
              <button className="btn self-start" onClick={() => {
                navigator.clipboard.writeText(`${location.origin}/api/calendar/${user.cal_token}.ics`);
                setMsg("Copied!"); setTimeout(() => setMsg(""), 1500);
              }}>Copy link</button>
              {msg && <p className="text-sm text-ea-brown">{msg}</p>}
            </div>
          )}
          {user.is_admin && <a className="btn btn--accent text-center" href="/admin">Schedule Admin</a>}
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
