export interface DeltaBuckets {
  actual: number;
  anterior: number;
}

// Aproximación aceptada: no existe una tabla de snapshots mensuales en el proyecto,
// así que se usa la fecha propia de cada fila (created_at/fecha_ingreso) como proxy
// del mes en que ocurrió — mismo criterio ya aceptado para updated_at como proxy de
// "último contacto" en estaEnfriando() (useLeads.ts). Mes calendario en hora local,
// igual que el resto de la fecha-matemática de este proyecto (diasEnMercado, etc.).
export function bucketPorMes<T>(rows: T[], getFecha: (row: T) => string | null, getValor?: (row: T) => number): DeltaBuckets {
  const hoy = new Date();
  const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);

  let actual = 0;
  let anterior = 0;
  for (const row of rows) {
    const fechaStr = getFecha(row);
    if (!fechaStr) continue;
    const fecha = new Date(fechaStr);
    const valor = getValor ? getValor(row) : 1;
    if (fecha >= inicioMesActual) actual += valor;
    else if (fecha >= inicioMesAnterior && fecha < inicioMesActual) anterior += valor;
  }
  return { actual, anterior };
}

export interface DeltaInfo {
  delta?: string;
  deltaPositive?: boolean;
  deltaInfo?: string;
}

// anterior === 0 evita una división por cero / un "+∞%" sin sentido — en ese caso se
// devuelve un texto informativo en vez de forzar un badge de porcentaje engañoso.
export function formatDelta({ actual, anterior }: DeltaBuckets): DeltaInfo {
  if (anterior === 0) {
    return actual > 0 ? { deltaInfo: "Sin datos del mes anterior" } : {};
  }
  const pct = ((actual - anterior) / anterior) * 100;
  const signo = pct >= 0 ? "+" : "";
  return { delta: `${signo}${pct.toFixed(0)}% vs mes anterior`, deltaPositive: pct >= 0 };
}
