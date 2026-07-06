import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

function Productores({ onVolver }) {
  const [lista, setLista] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vereda, setVereda] = useState("");
  const [finca, setFinca] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [importando, setImportando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState(null);
const [historialCompras, setHistorialCompras] = useState([]);
const [cargandoHistorial, setCargandoHistorial] = useState(false); // eslint-disable-line
  const [historial, setHistorial] = useState(null);
  const [productorHistorial, setProductorHistorial] = useState(null);
  const archivoRef = useRef(null);

  // --- Nuevo: estado para el historial ---
  

  useEffect(() => { cargarProductores(); }, []);

  const cargarProductores = async () => {
    const { data } = await supabase.from("productores").select("*").order("nombre");
    if (data) setLista(data);
  };

  const verHistorial = async (p) => {
    setProductorHistorial(p);
    const { data } = await supabase.from("acopios").select("*").eq("cedula", p.cedula).order("created_at", { ascending: false });
    setHistorial(data || []);
    window.scrollTo(0, 0);
  };

  const guardar = async () => {
    if (!nombre || !cedula) { setMensaje("Completa nombre y cedula."); return; }
    if (editando) {
      const { error } = await supabase.from("productores").update({ nombre, cedula, telefono, vereda, finca }).eq("id", editando);
      if (error) { setMensaje("Error: " + error.message); }
      else { setMensaje("Productor actualizado."); setEditando(null); setNombre(""); setCedula(""); setTelefono(""); setVereda(""); setFinca(""); cargarProductores(); }
    } else {
      const { error } = await supabase.from("productores").insert([{ nombre, cedula, telefono, vereda, finca }]);
      if (error) { setMensaje("Error: " + error.message); }
      else { setMensaje("Productor guardado."); setNombre(""); setCedula(""); setTelefono(""); setVereda(""); setFinca(""); cargarProductores(); }
    }
  };

  const editarProductor = (p) => {
    setEditando(p.id); setNombre(p.nombre); setCedula(p.cedula);
    setTelefono(p.telefono || ""); setVereda(p.vereda || ""); setFinca(p.finca || "");
    window.scrollTo(0, 0);
  };

  const cancelarEdicion = () => { setEditando(null); setNombre(""); setCedula(""); setTelefono(""); setVereda(""); setFinca(""); };

  const eliminar = async (id) => {
    if (!window.confirm("Seguro que deseas eliminar este productor?")) return;
    await supabase.from("productores").delete().eq("id", id);
    cargarProductores();
  };

  const importarCSV = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setImportando(true);
    const lector = new FileReader();
    lector.onload = async (ev) => {
      const texto = ev.target.result;
      const lineas = texto.split("\n").filter(l => l.trim());
      const datos = lineas.slice(1).map(linea => {
        const cols = linea.split(",");
        return { nombre: cols[0]?.trim().replace(/"/g, "") || "", cedula: cols[1]?.trim().replace(/"/g, "") || "", telefono: cols[2]?.trim().replace(/"/g, "") || "", vereda: cols[3]?.trim().replace(/"/g, "") || "", finca: cols[4]?.trim().replace(/"/g, "") || "" };
      }).filter(d => d.nombre && d.cedula);
      const { error } = await supabase.from("productores").insert(datos);
      if (error) { setMensaje("Error al importar: " + error.message); }
      else { setMensaje(datos.length + " productores importados."); cargarProductores(); }
      setImportando(false);
    };
    lector.readAsText(archivo);
  };

  // --- Nuevo: abrir y cargar historial de un productor ---
  

  const cerrarHistorial = () => {
    setHistorialAbierto(null);
    setHistorialCompras([]);
  };

  // --- Nuevo: totales acumulados del historial ---
  const totalKilos = historialCompras.reduce((s, a) => s + Number(a.kilos || 0), 0);
  const totalDinero = historialCompras.reduce((s, a) => s + Number(a.total || 0), 0);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      <h2 style={{ color: "#1a5c38" }}>Gestion de Productores</h2>

      {historial && productorHistorial && (
        <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24, border: "2px solid #1a5c38" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#1a5c38" }}>Historial: {productorHistorial.nombre}</h3>
            <button onClick={() => { setHistorial(null); setProductorHistorial(null); }} style={{ padding: "6px 14px", background: "#ccc", border: "none", borderRadius: 8, cursor: "pointer" }}>Cerrar</button>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "#1a5c38", color: "#fff", padding: 16, borderRadius: 10, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12 }}>Total kilos</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>{totalKilos.toFixed(1)} kg</p>
            </div>
            <div style={{ flex: 1, background: "#2b6cb0", color: "#fff", padding: 16, borderRadius: 10, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12 }}>Total pagado</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>${totalDinero.toLocaleString("es-CO")}</p>
            </div>
            <div style={{ flex: 1, background: "#744210", color: "#fff", padding: 16, borderRadius: 10, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12 }}>Visitas</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>{historial.length}</p>
            </div>
          </div>
          {historial.length === 0 ? <p style={{ color: "#999" }}>Este productor no tiene acopios registrados.</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: 8, textAlign: "left" }}>Fecha</th>
                <th style={{ padding: 8, textAlign: "left" }}>Kilos</th>
                <th style={{ padding: 8, textAlign: "left" }}>Precio/kg</th>
                <th style={{ padding: 8, textAlign: "left" }}>Total</th>
                <th style={{ padding: 8, textAlign: "left" }}>Observaciones</th>
              </tr></thead>
              <tbody>{historial.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleDateString("es-CO")}</td>
                  <td style={{ padding: 8 }}>{r.kilos} kg</td>
                  <td style={{ padding: 8 }}>${parseFloat(r.precio_kilo).toLocaleString("es-CO")}</td>
                  <td style={{ padding: 8 }}>${parseFloat(r.total).toLocaleString("es-CO")}</td>
                  <td style={{ padding: 8 }}>{r.observaciones || "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3>{editando ? "Editar productor" : "Nuevo productor"}</h3>
        <input placeholder="Nombre completo *" value={nombre} onChange={e => setNombre(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Cedula *" value={cedula} onChange={e => setCedula(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Telefono" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Vereda" value={vereda} onChange={e => setVereda(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Nombre de la finca" value={finca} onChange={e => setFinca(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={guardar} style={{ flex: 1, padding: 12, background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>{editando ? "Actualizar" : "Guardar Productor"}</button>
          {editando && <button onClick={cancelarEdicion} style={{ flex: 1, padding: 12, background: "#ccc", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>Cancelar</button>}
        </div>
        {mensaje && <p style={{ marginTop: 12, textAlign: "center", color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}</p>}
      </div>

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3>Importar desde Excel</h3>
        <p style={{ color: "#666", marginBottom: 12 }}>Columnas requeridas: <strong>nombre, cedula, telefono, vereda, finca</strong>. Guarda el Excel como CSV primero.</p>
        <input type="file" accept=".csv" ref={archivoRef} onChange={importarCSV} style={{ display: "none" }} />
        <button onClick={() => archivoRef.current.click()} disabled={importando} style={{ width: "100%", padding: 12, background: "#2b6cb0", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>{importando ? "Importando..." : "Seleccionar archivo CSV"}</button>
      </div>

      <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <h3>Productores registrados ({lista.length})</h3>
        {lista.length === 0 ? <p style={{ color: "#999" }}>No hay productores.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 8, textAlign: "left" }}>Nombre</th>
              <th style={{ padding: 8, textAlign: "left" }}>Cedula</th>
              <th style={{ padding: 8, textAlign: "left" }}>Telefono</th>
              <th style={{ padding: 8, textAlign: "left" }}>Vereda</th>
              <th style={{ padding: 8, textAlign: "left" }}>Finca</th>
              <th style={{ padding: 8 }}></th>
            </tr></thead>
            <tbody>{lista.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{p.nombre}</td>
                <td style={{ padding: 8 }}>{p.cedula}</td>
                <td style={{ padding: 8 }}>{p.telefono}</td>
                <td style={{ padding: 8 }}>{p.vereda}</td>
                <td style={{ padding: 8 }}>{p.finca}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => verHistorial(p)} style={{ background: "#6b46c1", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Historial</button>
                    <button onClick={() => editarProductor(p)} style={{ background: "#2b6cb0", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Editar</button>
                    <button onClick={() => eliminar(p.id)} style={{ background: "#e53e3e", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}F
      </div>

      {/* --- Nuevo: modal de historial --- */}
      {historialAbierto && (
        <div
          onClick={cerrarHistorial}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Historial de {historialAbierto.nombre}</h3>
              <button onClick={cerrarHistorial} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ color: "#666", marginTop: 0 }}>Cedula: {historialAbierto.cedula}</p>

            {cargandoHistorial ? (
              <p>Cargando historial...</p>
            ) : historialCompras.length === 0 ? (
              <p style={{ color: "#999" }}>Este productor aun no tiene compras registradas.</p>
            ) : (
              <>
                <div style={{ background: "#f0f7f2", padding: 16, borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  <div><strong>Total kilos:</strong> {totalKilos.toFixed(2)} kg</div>
                  <div><strong>Total pagado:</strong> ${totalDinero.toLocaleString("es-CO")}</div>
                  <div><strong>Compras:</strong> {historialCompras.length}</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: 6, textAlign: "left" }}>Fecha</th>
                    <th style={{ padding: 6, textAlign: "right" }}>Kilos</th>
                    <th style={{ padding: 6, textAlign: "right" }}>Precio/kg</th>
                    <th style={{ padding: 6, textAlign: "right" }}>Total</th>
                    <th style={{ padding: 6, textAlign: "left" }}>Obs.</th>
                  </tr></thead>
                  <tbody>{historialCompras.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 6 }}>{new Date(a.created_at).toLocaleDateString("es-CO")}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{Number(a.kilos).toFixed(2)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>${Number(a.precio_kilo).toLocaleString("es-CO")}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>${Number(a.total).toLocaleString("es-CO")}</td>
                      <td style={{ padding: 6 }}>{a.observaciones || "-"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Productores;
