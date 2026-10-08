import { useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending"); setMsg("");
    try {
      const r = await fetch("/api/contact", { method: "POST", body: new FormData(form) });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "Something went wrong.");
      setState("done"); form.reset();
    } catch (err: any) { setState("error"); setMsg(err.message || "Something went wrong."); }
  }

  if (state === "done") return (
    <div className="rounded-[10px] bg-white p-6 shadow-sm">
      <p className="m-0 font-semibold">Thanks! Your message is on its way.</p>
      <p className="m-0 mt-2 text-sm">We&apos;ll get back to you soon. <button className="underline" onClick={() => setState("idle")}>Send another</button></p>
    </div>
  );

  const field = "w-full rounded-md border border-ea-espresso/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-ea-accent";
  return (
    <form onSubmit={submit} className="grid gap-3">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm"><span>Name</span><input className={field} name="name" required maxLength={120} /></label>
        <label className="grid gap-1 text-sm"><span>Email</span><input className={field} type="email" name="email" required maxLength={200} /></label>
      </div>
      <label className="grid gap-1 text-sm"><span>Message</span><textarea className={field} name="message" required rows={5} maxLength={5000} /></label>
      <label className="grid gap-1 text-sm"><span>Attach files <span className="opacity-60">(optional, 8 MB max)</span></span>
        <input className="text-sm" type="file" name="files" multiple /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="subscribe" value="1" defaultChecked />Sign me up for the weekly email list</label>
      {state === "error" && <p className="m-0 text-sm text-red-700">{msg}</p>}
      <button className="btn justify-self-start" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send Message"}</button>
    </form>
  );
}
