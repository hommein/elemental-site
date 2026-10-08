import { useRef, useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles(prev => [...prev, ...incoming.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))]);
    if (fileInput.current) fileInput.current.value = "";
  }
  function removeFile(i: number) { setFiles(prev => prev.filter((_, j) => j !== i)); }
  const fmt = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending"); setMsg("");
    try {
      const fd = new FormData(form);
      fd.delete("files");
      for (const f of files) fd.append("files", f);
      const r = await fetch("/api/contact", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "Something went wrong.");
      setState("done"); form.reset(); setFiles([]);
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
      <div className="grid gap-1 text-sm">
        <span>Attach files <span className="opacity-60">(optional, 8 MB max)</span></span>
        <label className="cursor-pointer rounded-md border border-dashed border-ea-espresso/30 bg-white p-2 transition hover:border-ea-accent hover:bg-ea-cream/40 flex items-center gap-3">
          <span className="rounded-md bg-ea-espresso px-3 py-1.5 text-ea-paper text-sm">{files.length ? "Add more files" : "Choose files"}</span>
          <span className="opacity-60">{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} attached` : "No files chosen"}</span>
          <input ref={fileInput} className="hidden" type="file" name="files" multiple onChange={e => addFiles(e.target.files)} />
        </label>
        {files.length > 0 && (
          <ul className="m-0 list-none p-0 grid gap-1">
            {files.map((f, i) => (
              <li key={f.name + f.size} className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 border border-ea-espresso/10">
                <span className="truncate">{f.name}</span>
                <span className="opacity-50 shrink-0">{fmt(f.size)}</span>
                <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} title="Remove" className="ml-auto shrink-0 rounded-full w-6 h-6 leading-none text-ea-espresso/60 hover:bg-ea-espresso hover:text-ea-paper transition">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="subscribe" value="1" defaultChecked />Sign me up for the weekly email list</label>
      {state === "error" && <p className="m-0 text-sm text-red-700">{msg}</p>}
      <button className="btn justify-self-start" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send Message"}</button>
    </form>
  );
}
