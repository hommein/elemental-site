import { useEffect, useState } from "react";
import { me, setUser, type User } from "../lib/user";

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
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      ) : (
        <>
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
