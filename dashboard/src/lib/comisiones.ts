import type { PropertyItem } from "../hooks/useProperties";

// Reglas reales del negocio (confirmadas por el usuario): venta cobra 2%+IVA a
// cada lado (comprador y vendedor); arriendo cobra 50%+IVA de la garantía si el
// contrato dura menos de 24 meses, o 2%+IVA del total de rentas del contrato si
// dura 24 meses o más.
export const IVA = 0.19;
export const TASA_COMISION_VENTA = 0.02;
export const TASA_COMISION_ARRIENDO_LARGO = 0.02;
export const FACTOR_COMISION_ARRIENDO_CORTO = 0.5;
export const UMBRAL_MESES_ARRIENDO_LARGO = 24;

// Comisión de venta por lado (comprador O vendedor) — el total que cobra la
// agencia es el doble, ya que se cobra a ambas puntas de la operación.
export function comisionVentaUf(precioVentaUf: number | null): number | null {
  if (precioVentaUf == null) return null;
  return precioVentaUf * TASA_COMISION_VENTA * (1 + IVA) * 2;
}

export interface ComisionArriendoInput {
  precioArriendoClp: number | null;
  plazoContratoMeses: number | null;
  mesesGarantia: number | null;
}

// Devuelve null si faltan los datos que necesita la rama aplicable — nunca fuerza
// un 0 engañoso cuando en realidad no hay información suficiente para calcular.
export function comisionArriendoClp(input: ComisionArriendoInput): number | null {
  const { precioArriendoClp, plazoContratoMeses, mesesGarantia } = input;
  if (precioArriendoClp == null || plazoContratoMeses == null) return null;
  if (plazoContratoMeses < UMBRAL_MESES_ARRIENDO_LARGO) {
    if (mesesGarantia == null) return null;
    return mesesGarantia * precioArriendoClp * FACTOR_COMISION_ARRIENDO_CORTO * (1 + IVA);
  }
  return precioArriendoClp * plazoContratoMeses * TASA_COMISION_ARRIENDO_LARGO * (1 + IVA);
}

export interface ComisionResultado {
  tipo: "venta" | "arriendo";
  montoClp: number;
}

// Punto de entrada único para el PDF y el KPI de comisiones en Reportes.tsx — se
// expresa en CLP (convierte la comisión de venta con valorUf) para poder sumar
// venta y arriendo en un solo total.
export function comisionPropiedadClp(
  property: Pick<PropertyItem, "estado_propiedad" | "precio_venta_uf" | "precio_arriendo_clp" | "plazo_contrato_meses" | "meses_garantia">,
  valorUf: number | null
): ComisionResultado | null {
  if (property.estado_propiedad === "Vendida") {
    const comisionUf = comisionVentaUf(property.precio_venta_uf);
    if (comisionUf == null || !valorUf) return null;
    return { tipo: "venta", montoClp: comisionUf * valorUf };
  }
  if (property.estado_propiedad === "En Arriendo") {
    const montoClp = comisionArriendoClp({
      precioArriendoClp: property.precio_arriendo_clp,
      plazoContratoMeses: property.plazo_contrato_meses,
      mesesGarantia: property.meses_garantia,
    });
    if (montoClp == null) return null;
    return { tipo: "arriendo", montoClp };
  }
  return null;
}
