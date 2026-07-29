import { jsPDF } from "jspdf";
import type { PropertyItem } from "../hooks/useProperties";
import { diasEnMercado } from "../hooks/useProperties";
import { comisionPropiedadClp } from "./comisiones";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const clpFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

// Genera y descarga un PDF de una página con el resumen de la propiedad para su
// propietario — dirección/tipo/estado, precio (UF + equivalente CLP), DOM, y la
// comisión estimada según las reglas de comisiones.ts. Solo lectura de datos ya
// cargados en Reportes.tsx (properties/valorUf) — no hace ningún fetch propio.
export function generarInformePropietarioPdf(property: PropertyItem, valorUf: number | null): void {
  const doc = new jsPDF();
  const margenX = 20;
  let y = 22;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PyO Homes Comercial", margenX, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Informe de Propiedad para Propietario", margenX, y);
  y += 4;
  doc.setDrawColor(200);
  doc.line(margenX, y, 190, y);
  y += 10;

  function fila(label: string, valor: string) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margenX, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margenX + 55, y);
    y += 8;
  }

  fila("Dirección", property.direccion ?? "—");
  fila("Comuna", property.comuna ?? "—");
  fila("Tipo de Propiedad", property.tipo_propiedad ?? "—");
  fila("Estado", property.estado_propiedad);

  y += 2;
  doc.line(margenX, y, 190, y);
  y += 10;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Precio y Mercado", margenX, y);
  y += 8;
  doc.setFontSize(12);

  if (property.precio_venta_uf) {
    const equivalenteClp = valorUf ? property.precio_venta_uf * valorUf : null;
    fila(
      "Precio de Venta",
      `UF ${ufFormat.format(property.precio_venta_uf)}${equivalenteClp ? ` (aprox. $${clpFormat.format(equivalenteClp)})` : ""}`
    );
  }
  if (property.precio_arriendo_clp) {
    fila("Arriendo Mensual", `$${clpFormat.format(property.precio_arriendo_clp)}`);
  }

  const dom = diasEnMercado(property);
  fila("Días en el Mercado (DOM)", dom !== null ? `${dom} días` : "Sin publicar todavía");

  y += 2;
  doc.line(margenX, y, 190, y);
  y += 10;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Comisión Estimada", margenX, y);
  y += 8;
  doc.setFontSize(12);

  const comision = comisionPropiedadClp(property, valorUf);
  if (comision) {
    fila(
      comision.tipo === "venta" ? "Comisión de Venta (2%+IVA ambas puntas)" : "Comisión de Arriendo",
      `$${clpFormat.format(comision.montoClp)}`
    );
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("No hay datos suficientes para calcular la comisión todavía.", margenX, y);
    y += 8;
  }

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-CL")}`, margenX, y);

  const nombreArchivo = `Informe_${(property.direccion ?? property.codigo_interno).replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`;
  doc.save(nombreArchivo);
}
