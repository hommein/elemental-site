import { useEffect } from "react";

export default function Lightbox({ src, alt, onClose }: { src: string | null; alt?: string; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" onClick={onClose} aria-label="Close"
        className="absolute top-3 right-4 text-white/90 hover:text-white text-4xl leading-none bg-transparent border-0 cursor-pointer">&times;</button>
      <img src={src} alt={alt || ""} onClick={e => e.stopPropagation()} className="max-w-full max-h-[92vh] rounded-[10px] shadow-xl cursor-default" />
    </div>
  );
}
