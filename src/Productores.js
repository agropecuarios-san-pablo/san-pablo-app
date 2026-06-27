import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

function Productores({ onVolver }) {
  const [lista, setLista] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vereda, setVereda] = useState("");
  const [finca, setFinca] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => { cargarProductores(); }, []);

  const cargarProductores = async () => {
    const { data } = await supabase.from("productores").select("*").order("nombre");
    if (data) setLista(data);
  };

  const guardar = async () => {
    if (!nombre || !cedula) { setMensaje("Completa nombre y cedula."); return; }
    const { error } = await supabase.from("productores").insert([{ nombre, cedula, telefono, vereda, finca }]);
    if (error) { setMensaje("Error: " + error.message); }
    else { setMensaje("Productor guardado."); setNombre(""); setCedula(""); setTelefono(""); setVereda(""); setFinca(""); cargarProductores(); }
  };

  const eliminar = async (id) => {
    await supabase.from("productores").delete().eq("id", id);
    cargarProductores();
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      <h2 style={{ color: "#1a5c38" }}>Gestion de Productores</h2>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3>Nuevo productor</h3>
        <input placeholder="Nombre completo *" value={nombre} onChange={e => setNombre(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Cedula *" value={cedula} onChange={e => setCedula(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Telefono" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Vereda" value={vereda} onChange={e => setVereda(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <input placeholder="Nombre de la finca" value={finca} onChange={e => setFinca(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
        <button onClick={guardar} style={{ width: "100%", padding: 12, background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>Guardar Productor</button>
        {mensaje && <p style={{ marginTop: 12, textAlign: "center", color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}</p>}
      </div>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <h3>Productores registrados</h3>
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
              <tr key={p.id}>
                <td style={{ padding: 8 }}>{p.nombre}</td>
                <td style={{ padding: 8 }}>{p.cedula}</td>
                <td style={{ padding: 8 }}>{p.telefono}</td>
                <td style={{ padding: 8 }}>{p.vereda}</td>
                <td style={{ padding: 8 }}>{p.finca}</td>
                <td style={{ padding: 8, textAlign: "center" }}><button onClick={() => eliminar(p.id)} style={{ background: "#e53e3e", color: "#fff", border: "none", padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>Eliminar</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Productores;