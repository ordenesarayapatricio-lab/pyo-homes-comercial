export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-white/10 rounded-lg">
      <span className="material-symbols-outlined text-gold text-4xl mb-3">construction</span>
      <h2 className="font-headline-md text-lg font-bold text-white">{title}</h2>
      <p className="text-sm text-on-surface-variant mt-1">Esta sección se construirá en una próxima fase.</p>
    </div>
  );
}
