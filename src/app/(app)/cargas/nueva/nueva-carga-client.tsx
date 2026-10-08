"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { MovementType } from "@prisma/client";
import { AlertTriangle, Check, ClipboardCheck, Copy, Info, Plus, Save, Trash2, Upload } from "lucide-react";
import { movementLabels } from "@/lib/format";

type Row = {
  codigoArticulo: string;
  descripcionArticulo: string;
  lote: string;
  cantidadPrevista: string;
  ubicacionOrigen: string;
  ubicacionDestino: string;
  ordenFabricacion: string;
  comentario: string;
};

const emptyRow = (): Row => ({
  codigoArticulo: "",
  descripcionArticulo: "",
  lote: "",
  cantidadPrevista: "",
  ubicacionOrigen: "",
  ubicacionDestino: "",
  ordenFabricacion: "",
  comentario: "",
});

const columns: { key: keyof Row; label: string; width: string }[] = [
  { key: "codigoArticulo", label: "Código artículo", width: "w-40" },
  { key: "descripcionArticulo", label: "Descripción", width: "w-72" },
  { key: "lote", label: "Lote", width: "w-44" },
  { key: "cantidadPrevista", label: "Cantidad", width: "w-28" },
  { key: "ubicacionOrigen", label: "Origen", width: "w-28" },
  { key: "ubicacionDestino", label: "Destino", width: "w-28" },
  { key: "ordenFabricacion", label: "OF", width: "w-32" },
  { key: "comentario", label: "Comentario", width: "w-72" },
];

type RowIssue = {
  row: number;
  field: string;
  message: string;
};

function normalizeQuantity(value: string) {
  const cleaned = value.trim().replace(/\s/g, "").replace(/[a-zA-Z]+/g, "");
  if (!cleaned) return "";
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    return cleaned.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".");
  }
  if (hasComma) return cleaned.replace(",", ".");
  return cleaned;
}

function normalizeRow(row: Row): Row {
  return {
    codigoArticulo: row.codigoArticulo.trim(),
    descripcionArticulo: row.descripcionArticulo.trim(),
    lote: row.lote.trim(),
    cantidadPrevista: normalizeQuantity(row.cantidadPrevista),
    ubicacionOrigen: row.ubicacionOrigen.trim().toUpperCase(),
    ubicacionDestino: row.ubicacionDestino.trim().toUpperCase(),
    ordenFabricacion: row.ordenFabricacion.trim(),
    comentario: row.comentario.trim(),
  };
}

export function NuevaCargaClient() {
  const router = useRouter();
  const [common, setCommon] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipoMovimiento: "CARGA_OF",
    nbiEntrega: "",
    nbiRecepcion: "",
    ubicacionDestino: "",
    ordenFabricacion: "",
  });
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rowIssues, setRowIssues] = useState<RowIssue[]>([]);
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [saving, setSaving] = useState(false);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const quantityFormatter = useMemo(() => new Intl.NumberFormat("es-ES"), []);

  function updateRow(index: number, key: keyof Row, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function addRows(count: number) {
    setRows((current) => [...current, ...Array.from({ length: count }, emptyRow)]);
  }

  function duplicateRow(index: number) {
    setRows((current) => {
      const next = [...current];
      next.splice(index + 1, 0, { ...current[index] });
      return next;
    });
  }

  function deleteRow(index: number) {
    setRows((current) => current.length === 1 ? [emptyRow()] : current.filter((_, rowIndex) => rowIndex !== index));
  }

  function focusCell(rowIndex: number, colIndex: number) {
    refs.current[`${rowIndex}:${colIndex}`]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      save();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateRow(rowIndex);
      window.setTimeout(() => focusCell(rowIndex + 1, colIndex), 0);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (rowIndex === rows.length - 1) setRows((current) => [...current, emptyRow()]);
      window.setTimeout(() => focusCell(rowIndex + 1, colIndex), 0);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    pasteTextIntoGrid(text, startRow, startCol);
  }

  function pasteTextIntoGrid(text: string, startRow = 0, startCol = 0) {
    const parsed = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t"));
    if (!parsed.length) return;
    setRows((current) => {
      const next = [...current];
      while (next.length < startRow + parsed.length) next.push(emptyRow());
      parsed.forEach((cells, rowOffset) => {
        cells.forEach((cell, colOffset) => {
          const column = columns[startCol + colOffset];
          if (column) next[startRow + rowOffset] = { ...next[startRow + rowOffset], [column.key]: cell.trim() };
        });
      });
      return next;
    });
  }

  async function importFromClipboard() {
    setError("");
    setRowIssues([]);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError("El portapapeles está vacío.");
        return;
      }
      pasteTextIntoGrid(text, 0, 0);
      setMessage("Datos pegados desde Excel. Revisa las líneas antes de guardar.");
    } catch {
      setError("No se pudo leer el portapapeles. También puedes pegar directamente sobre la primera celda con Ctrl+V.");
    }
  }

  function applyPasteBuffer() {
    setError("");
    setRowIssues([]);
    if (!pasteBuffer.trim()) {
      setError("Pega primero varias líneas en el cuadro de carga rápida.");
      return;
    }
    pasteTextIntoGrid(pasteBuffer, 0, 0);
    setMessage("Líneas interpretadas. Puedes guardar con Ctrl+Enter si todo está correcto.");
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    setRowIssues([]);
    const filledRows = rows
      .map(normalizeRow)
      .filter((row) => Object.values(row).some((value) => value.trim() !== ""));
    if (!filledRows.length) {
      setSaving(false);
      setError("Añade al menos una línea para guardar.");
      return;
    }
    const res = await fetch("/api/cargas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        common,
        rows: filledRows.map((row) => ({
          ...row,
          ubicacionDestino: row.ubicacionDestino || common.ubicacionDestino,
          ordenFabricacion: row.ordenFabricacion || common.ordenFabricacion,
        })),
      }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(body.error || "No se pudieron guardar las cargas.");
      setRowIssues(body.rowIssues || []);
      return;
    }
    setMessage(body.message || "Cargas registradas correctamente.");
    setRows([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
    router.refresh();
  }

  const filledRows = rows.map(normalizeRow).filter((row) => row.codigoArticulo.trim() || row.descripcionArticulo.trim() || row.cantidadPrevista.trim());
  const validRows = filledRows.filter((row) => row.codigoArticulo.trim() && row.descripcionArticulo.trim() && Number(row.cantidadPrevista) > 0);
  const warningRows = filledRows.filter((row) => !row.ubicacionOrigen.trim() || !(row.ubicacionDestino.trim() || common.ubicacionDestino.trim()));
  const errorRows = filledRows.length - validRows.length;
  const totalQuantity = filledRows.reduce((sum, row) => sum + (Number(row.cantidadPrevista) || 0), 0);
  const rowIssueMap = useMemo(() => {
    const map = new Map<number, RowIssue[]>();
    rowIssues.forEach((issue) => {
      const list = map.get(issue.row) ?? [];
      list.push(issue);
      map.set(issue.row, list);
    });
    return map;
  }, [rowIssues]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0b1b33]">Nueva carga</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b8299]">Entrada rápida de datos tipo Excel para cargas por realizar</p>
        </div>
        <button className="btn btn-primary" disabled={saving || errorRows > 0 || filledRows.length === 0} onClick={save} type="button" title="Ctrl+Enter">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cargas"}
        </button>
      </div>

      {message ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div> : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">{error}</div> : null}

      <section className="app-card p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
          <div>
        <h2 className="font-black text-[#0b1b33]">Datos comunes</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">Fecha</span>
            <input className="field mt-1" type="date" value={common.fecha} onChange={(e) => setCommon({ ...common, fecha: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">Tipo movimiento</span>
            <select className="field mt-1" value={common.tipoMovimiento} onChange={(e) => setCommon({ ...common, tipoMovimiento: e.target.value })}>
              {Object.values(MovementType).map((item) => <option key={item} value={item}>{movementLabels[item]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">NBI entrega</span>
            <input className="field mt-1" value={common.nbiEntrega} onChange={(e) => setCommon({ ...common, nbiEntrega: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">NBI recepción</span>
            <input className="field mt-1" value={common.nbiRecepcion} onChange={(e) => setCommon({ ...common, nbiRecepcion: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">Destino principal</span>
            <input className="field mt-1" value={common.ubicacionDestino} onChange={(e) => setCommon({ ...common, ubicacionDestino: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">OF principal</span>
            <input className="field mt-1" value={common.ordenFabricacion} onChange={(e) => setCommon({ ...common, ordenFabricacion: e.target.value })} />
          </label>
        </div>
          </div>
          <div className="rounded-md bg-[#eaf4ff] p-4 text-sm text-[#17324d]">
            <div className="flex items-center gap-2 font-black">
              <Info className="h-5 w-5 text-[#1f73e8]" />
              Información
            </div>
            <p className="mt-3 font-semibold leading-relaxed text-[#45627f]">Estos datos se aplicarán por defecto a todas las líneas. Puedes modificarlos individualmente en cada fila si es necesario.</p>
          </div>
        </div>
      </section>

      <section className="app-card p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-black text-[#0b1b33]">Carga rápida desde Excel</h2>
            <p className="mt-1 text-sm font-semibold text-[#6b8299]">
              Pega filas completas en el orden: artículo, descripción, lote, cantidad, origen, destino, OF y comentario.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={importFromClipboard} type="button"><Upload className="h-4 w-4" /> Leer portapapeles</button>
            <button className="btn btn-primary" onClick={applyPasteBuffer} type="button"><Check className="h-4 w-4" /> Pasar a la tabla</button>
          </div>
        </div>
        <textarea
          className="field mt-3 min-h-24 resize-y font-mono text-xs"
          onChange={(event) => setPasteBuffer(event.target.value)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (text.includes("\t") || text.includes("\n")) {
              window.setTimeout(() => pasteTextIntoGrid(text, 0, 0), 0);
            }
          }}
          placeholder={"1375900118\tENVUELTAS F2 155MM\t2601182\t436\tWC071\tWC091\t160361\n1376800038\tPOLV.B7M67 PARA M67FC\tFAG26D001-008\t900\tC383\tF217\t160371"}
          value={pasteBuffer}
        />
      </section>

      <section className="app-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d7e2ee] px-4 py-3">
          <h2 className="font-black text-[#0b1b33]">Líneas de carga</h2>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={addRow} type="button"><Plus className="h-4 w-4" /> Añadir fila</button>
            <button className="btn btn-secondary" onClick={() => addRows(20)} type="button">+20 filas</button>
            <button className="btn btn-secondary" onClick={importFromClipboard} type="button"><Upload className="h-4 w-4" /> Pegar desde Excel</button>
            <button className="btn btn-secondary" onClick={() => setRows([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()])} type="button">Limpiar</button>
          </div>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="app-table min-w-[1320px]">
            <thead>
              <tr>
                <th className="w-12 px-2 py-2">#</th>
                {columns.map((column) => <th key={column.key} className={`${column.width} px-2 py-2 font-black`}>{column.label}</th>)}
                <th className="w-28 px-2 py-2 font-black">Validación</th>
                <th className="w-36 px-2 py-2 font-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="px-2 py-1 text-xs font-bold text-slate-500">{rowIndex + 1}</td>
                  {columns.map((column, colIndex) => (
                    <td key={column.key} className="px-2 py-1">
                      <input
                        ref={(node) => { refs.current[`${rowIndex}:${colIndex}`] = node; }}
                        className="field h-9 px-2 py-1"
                        value={row[column.key]}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(rowIndex, column.key, event.target.value)}
                        onBlur={() => {
                          if (column.key === "cantidadPrevista") updateRow(rowIndex, column.key, normalizeQuantity(row[column.key]));
                          if (column.key === "ubicacionOrigen" || column.key === "ubicacionDestino") updateRow(rowIndex, column.key, row[column.key].trim().toUpperCase());
                        }}
                        onKeyDown={(event) => onKeyDown(event, rowIndex, colIndex)}
                        onPaste={(event) => onPaste(event, rowIndex, colIndex)}
                      />
                      {rowIssueMap.get(rowIndex + 1)?.some((issue) => issue.field === column.key) ? (
                        <p className="mt-1 text-[11px] font-bold text-red-700">{rowIssueMap.get(rowIndex + 1)?.find((issue) => issue.field === column.key)?.message}</p>
                      ) : null}
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    {rowIssueMap.has(rowIndex + 1) ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-800"><AlertTriangle className="h-3 w-3" /> Revisar</span>
                    ) : row.codigoArticulo || row.descripcionArticulo || row.cantidadPrevista ? (
                      row.codigoArticulo && row.descripcionArticulo && Number(normalizeQuantity(row.cantidadPrevista)) > 0
                        ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800"><Check className="h-3 w-3" /> OK</span>
                        : <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-800"><AlertTriangle className="h-3 w-3" /> Revisar</span>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="space-x-1 px-2 py-1">
                    <button className="btn btn-secondary px-2 py-1" onClick={() => duplicateRow(rowIndex)} type="button" title="Duplicar línea"><Copy className="h-4 w-4" /></button>
                    <button className="btn btn-secondary px-2 py-1" onClick={() => deleteRow(rowIndex)} type="button" title="Eliminar línea"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {rowIssues.length ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <h2 className="font-black">Errores por línea</h2>
          <ul className="mt-2 space-y-1">
            {rowIssues.slice(0, 12).map((issue, index) => (
              <li key={`${issue.row}-${issue.field}-${index}`} className="font-semibold">
                Línea {issue.row}: {issue.message}
              </li>
            ))}
          </ul>
          {rowIssues.length > 12 ? <p className="mt-2 font-bold">Hay más errores. Corrige los primeros y vuelve a guardar.</p> : null}
        </section>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-3">
        <div className="app-card bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-emerald-700" />
            <div>
              <h2 className="font-black text-[#0b1b33]">Vista previa</h2>
              <p className="text-sm font-semibold text-[#45627f]">Así se registrará la carga en el sistema</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Preview label="Fecha" value={common.fecha} />
            <Preview label="Tipo de movimiento" value={movementLabels[common.tipoMovimiento as MovementType]} />
            <Preview label="NBI entrega" value={common.nbiEntrega || "-"} />
            <Preview label="Destino principal" value={common.ubicacionDestino || "-"} />
            <Preview label="OF principal" value={common.ordenFabricacion || "-"} />
          </dl>
        </div>
        <div className="app-card p-4">
          <div className="flex items-center gap-3">
            <Check className="h-8 w-8 text-[#1f73e8]" />
            <div>
              <h2 className="font-black text-[#0b1b33]">Validación previa</h2>
              <p className="text-sm font-semibold text-[#45627f]">Comprobación de campos obligatorios</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm font-bold">
            <p className="text-emerald-700">{validRows.length} líneas correctas</p>
            <p className="text-amber-700">{warningRows.length} líneas con advertencias</p>
            <p className="text-red-700">{errorRows} líneas con errores</p>
          </div>
        </div>
        <div className="app-card p-4">
          <h2 className="font-black text-[#0b1b33]">Resumen de la carga</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Preview label="Total de líneas" value={String(filledRows.length)} />
            <Preview label="Líneas correctas" value={String(validRows.length)} />
            <Preview label="Líneas con advertencias" value={String(warningRows.length)} />
            <Preview label="Líneas con errores" value={String(errorRows)} />
            <Preview label="Cantidad total" value={quantityFormatter.format(totalQuantity)} />
          </dl>
          {errorRows > 0 ? <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Revisa las incidencias antes de guardar.</div> : null}
        </div>
      </section>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#d7e2ee] pb-2">
      <dt className="font-bold text-[#6b8299]">{label}</dt>
      <dd className="text-right font-semibold text-[#17324d]">{value}</dd>
    </div>
  );
}
