interface Props {
  value: number;
  max: number;
  label?: string;
}

// Círculo con el número, coloreado según qué tan alto es el valor relativo a `max` —
// más legible de un vistazo que barras pequeñas. Sirve tanto para urgencia_venta (1-5)
// como nivel_calificacion (1-3).
export function ScoreIndicator({ value, max, label }: Props) {
  const ratio = value / max;
  const colorClass =
    ratio >= 0.8
      ? "bg-error text-white"
      : ratio >= 0.5
        ? "bg-gold text-primary-container"
        : "bg-surface-container-high text-on-surface-variant border border-white/15";

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 ${colorClass}`}
      title={label ?? `${value}/${max}`}
    >
      {value}
    </span>
  );
}
