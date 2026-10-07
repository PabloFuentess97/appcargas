"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef, useState } from "react";
import { MovementType } from "@prisma/client";
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
  const [saving, setSaving] = useState(false);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  function updateRow(index: number, key: keyof Row, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
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
    const parsed = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split("\t"));

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

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    const validRows = rows.filter((row) => row.codigoArticulo.trim() || row.descripcionArticulo.trim() || row.cantidadPrevista.trim());
    const res = await fetch("/api/cargas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        common,
        rows: validRows.map((row) => ({
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
      return;
    }
    setMessage(body.message || "Cargas registradas correctamente.");
    setRows([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Nueva carga</h1>
          <p className="mt-1 text-sm text-slate-600">Entrada rápida de líneas con comportamiento similar a Excel</p>
        </div>
        <button className="btn btn-primary" disabled={saving} onClick={save} type="button">
          {saving ? "Guardando..." : "Guardar cargas"}
        </button>
      </div>

      {message ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div> : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">{error}</div> : null}

      <section className="border border-slate-200 bg-white p-4">
        <h2 className="font-black">Datos comunes</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="font-black">Tabla editable</h2>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={addRow} type="button">Añadir fila</button>
            <button className="btn btn-secondary" onClick={() => setRows([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()])} type="button">Limpiar</button>
          </div>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-[1320px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="w-12 px-2 py-2">#</th>
                {columns.map((column) => <th key={column.key} className={`${column.width} px-2 py-2 font-black`}>{column.label}</th>)}
                <th className="w-48 px-2 py-2 font-black">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  <td className="px-2 py-1 text-xs font-bold text-slate-500">{rowIndex + 1}</td>
                  {columns.map((column, colIndex) => (
                    <td key={column.key} className="px-2 py-1">
                      <input
                        ref={(node) => { refs.current[`${rowIndex}:${colIndex}`] = node; }}
                        className="field h-9 px-2 py-1"
                        value={row[column.key]}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(rowIndex, column.key, event.target.value)}
                        onKeyDown={(event) => onKeyDown(event, rowIndex, colIndex)}
                        onPaste={(event) => onPaste(event, rowIndex, colIndex)}
                      />
                    </td>
                  ))}
                  <td className="space-x-2 px-2 py-1">
                    <button className="btn btn-secondary px-2 py-1" onClick={() => duplicateRow(rowIndex)} type="button">Duplicar</button>
                    <button className="btn btn-secondary px-2 py-1" onClick={() => deleteRow(rowIndex)} type="button">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
