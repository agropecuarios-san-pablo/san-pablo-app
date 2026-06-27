import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

function Reportes() {
  const [registros, setRegistros] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filtrado, setFiltrado] = useState([]);

  useEffect(() => { cargarRegistros(); }, []);

  const cargarRegistros = async () => {
    const { data } = await supabase.from("acopios").select("*").order("created_at", { ascending: false });
    if (data) { setRegistros(data); setFiltrado(data); }
  };

  const filtrar = () => {
    let resultado = registros;
    if (fechaInicio) resultado = resultado.filter(r => new Date(r.created_at) >= new Date(fechaInicio));
    if (fechaFin) resultado = resultado.filter(r => new Date(r.created_at) <= new Date(fechaFin + "T23:59:59"));
    setFiltrado(resultado);
  };

  const totalKilos = filtrado.reduce((sum, r) => sum + parseFloat(r.kilos || 0), 0);
  const totalPesos = filtrado.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);

  const porProductor = filtrado.reduce((acc, r) => {
    if (!acc[r.productor]) acc[r.productor] = { kilos: 0, total: 0, cedula: r.cedula, telefono: r.telefono, vereda: r.vereda, finca: r.finca };
    acc[r.productor].kilos += parseFloat(r.kilos || 0);
    acc[r.productor].total += parseFloat(r.total || 0);
    return acc;
  }, {});

  const exportarCSV = () => {
    const filas = [["Productor", "Cedula", "Telefono", "Vereda", "Finca", "Kilos", "Precio/kg", "Total", "Fecha", "Hora"]];
    filtrado.forEach(r => filas.push([
      r.productor, r.cedula, r.telefono, r.vereda, r.finca,
      r.kilos, r.precio_kilo, r.total,
      new Date(r.created_at).toLocaleDateString("es-CO"),
      new Date(r.created_at).toLocaleTimeString("es-CO")
    ]));
    const csv = filas.map(f => f.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-acopio.csv";
    a.click();
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h2 style={{ color: "#1a5c38" }}>Reportes</h2>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3>Filtrar por fecha</h3>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, color: "#555" }}>Desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, color: "#555" }}>Hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={filtrar} style={{ flex: 1, padding: 10, background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Filtrar</button>
          <button onClick={() => { setFechaInicio(""); setFechaFin(""); setFiltrado(registros); }} style={{ flex: 1, padding: 10, background: "#ccc", border: "none", borderRadius: 8, cursor: "pointer" }}>Ver todo</button>
          <button onClick={exportarCSV} style={{ flex: 1, padding: 10, background: "#2b6cb0", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Exportar Excel</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#1a5c38", color: "#fff", padding: 24, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14 }}>Total Kilos</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: "bold" }}>{totalKilos.toFixed(1)} kg</p>
        </div>
        <div style={{ flex: 1, background: "#2b6cb0", color: "#fff", padding: 24, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14 }}>Total Pagado</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: "bold" }}>${totalPesos.toLocaleString("es-CO")}</p>
        </div>
        <div style={{ flex: 1, background: "#744210", color: "#fff", padding: 24, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14 }}>Registros</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: "bold" }}>{filtrado.length}</p>
        </div>
      </div>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3>Resumen por productor</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: 8, textAlign: "left" }}>Productor</th>
            <th style={{ padding: 8, textAlign: "left" }}>Cedula</th>
            <th style={{ padding: 8, textAlign: "left" }}>Telefono</th>
            <th style={{ padding: 8, textAlign: "left" }}>Vereda</th>
            <th style={{ padding: 8, textAlign: "left" }}>Finca</th>
            <th style={{ padding: 8, textAlign: "left" }}>Kilos</th>
            <th style={{ padding: 8, textAlign: "left" }}>Total</th>
          </tr></thead>
          <tbody>{Object.entries(porProductor).map(([nombre, d]) => (
            <tr key={nombre}>
              <td style={{ padding: 8 }}>{nombre}</td>
              <td style={{ padding: 8 }}>{d.cedula}</td>
              <td style={{ padding: 8 }}>{d.telefono}</td>
              <td style={{ padding: 8 }}>{d.vereda}</td>
              <td style={{ padding: 8 }}>{d.finca}</td>
              <td style={{ padding: 8 }}>{d.kilos.toFixed(1)} kg</td>
              <td style={{ padding: 8 }}>${d.total.toLocaleString("es-CO")}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <h3>Detalle completo</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead><tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 8, textAlign: "left" }}>Productor</th>
              <th style={{ padding: 8, textAlign: "left" }}>Cedula</th>
              <th style={{ padding: 8, textAlign: "left" }}>Telefono</th>
              <th style={{ padding: 8, textAlign: "left" }}>Vereda</th>
              <th style={{ padding: 8, textAlign: "left" }}>Finca</th>
              <th style={{ padding: 8, textAlign: "left" }}>Kilos</th>
              <th style={{ padding: 8, textAlign: "left" }}>Precio/kg</th>
              <th style={{ padding: 8, textAlign: "left" }}>Total</th>
              <th style={{ padding: 8, textAlign: "left" }}>Fecha</th>
              <th style={{ padding: 8, textAlign: "left" }}>Hora</th>
            </tr></thead>
            <tbody>{filtrado.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{r.productor}</td>
                <td style={{ padding: 8 }}>{r.cedula}</td>
                <td style={{ padding: 8 }}>{r.telefono}</td>
                <td style={{ padding: 8 }}>{r.vereda}</td>
                <td style={{ padding: 8 }}>{r.finca}</td>
                <td style={{ padding: 8 }}>{r.kilos}</td>
                <td style={{ padding: 8 }}>${r.precio_kilo}</td>
                <td style={{ padding: 8 }}>${parseFloat(r.total).toLocaleString("es-CO")}</td>
                <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleDateString("es-CO")}</td>
                <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleTimeString("es-CO")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reportes;