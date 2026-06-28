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
  const archivoRef = useRef(null);

  useEffect(() => { cargarProductores(); }, []);

  const cargarProductores = async () => {
    const { data } = await supabase.from("productores").select("*").order("nombre");
    if (data) setLista(data);
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
    setEditando(p.id);
    setNombre(p.nombre);
    setCedula(p.cedula);
    setTelefono(p.telefono || "");
    setVereda(p.vereda || "");
    setFinca(p.finca || "");
    window.scrollTo(0, 0);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setNombre(""); setCedula(""); setTelefono(""); setVereda(""); setFinca("");
  };

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
  };return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      <h2 style={{ color: "#1a5c38" }}>Gestion de Productores</h2>
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
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => editarProductor(p)} style={{ background: "#2b6cb0", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Editar</button>
                    <button onClick={() => eliminar(p.id)} style={{ background: "#e53e3e", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Productores;