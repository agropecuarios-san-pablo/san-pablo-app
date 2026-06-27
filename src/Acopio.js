import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

function Acopio({ usuario }) {
  const [form, setForm] = useState({ kilos: "", precio_kilo: "", observaciones: "" });
  const [productores, setProductores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [productorSeleccionado, setProductorSeleccionado] = useState(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [reciboActual, setReciboActual] = useState(null);

  useEffect(() => { cargarProductores(); cargarRegistros(); }, []);

  const cargarProductores = async () => {
    const { data } = await supabase.from("productores").select("*").order("nombre");
    if (data) setProductores(data);
  };

  const cargarRegistros = async () => {
    const { data } = await supabase.from("acopios").select("*").order("created_at", { ascending: false });
    if (data) setRegistros(data);
  };

  const sugerencias = productores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) && busqueda.length > 0);

  const seleccionarProductor = (p) => {
    setProductorSeleccionado(p);
    setBusqueda(p.nombre);
    setMostrarSugerencias(false);
  };

  const manejarCambio = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };

  const guardarAcopio = async () => {
    if (!productorSeleccionado || !form.kilos || !form.precio_kilo) { setMensaje("Selecciona un productor y completa los campos."); return; }
    setCargando(true);
    const { data, error } = await supabase.from("acopios").insert([{ productor: productorSeleccionado.nombre, cedula: productorSeleccionado.cedula, telefono: productorSeleccionado.telefono, vereda: productorSeleccionado.vereda, finca: productorSeleccionado.finca, kilos: parseFloat(form.kilos), precio_kilo: parseFloat(form.precio_kilo), total: parseFloat(form.kilos) * parseFloat(form.precio_kilo), observaciones: form.observaciones, usuario_id: usuario.id }]).select();
    if (error) { setMensaje("Error: " + error.message); }
    else { setMensaje("Acopio registrado."); setReciboActual(data[0]); setForm({ kilos: "", precio_kilo: "", observaciones: "" }); setBusqueda(""); setProductorSeleccionado(null); cargarRegistros(); }
    setCargando(false);
  };return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      {reciboActual && (
        <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24, border: "2px solid #1a5c38" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h2 style={{ color: "#1a5c38", margin: 0 }}>Agropecuarios San Pablo</h2>
            <p style={{ color: "#666", margin: 4 }}>Sistema de Acopio de Cacao</p>
            <hr />
            <h3>RECIBO DE COMPRA</h3>
          </div>
          <div style={{ marginBottom: 12 }}>
            <p><strong>Fecha:</strong> {new Date(reciboActual.created_at).toLocaleDateString("es-CO")}</p>
            <p><strong>Hora:</strong> {new Date(reciboActual.created_at).toLocaleTimeString("es-CO")}</p>
            <p><strong>Productor:</strong> {reciboActual.productor}</p>
            <p><strong>Cedula:</strong> {reciboActual.cedula}</p>
            <p><strong>Telefono:</strong> {reciboActual.telefono}</p>
            <p><strong>Vereda:</strong> {reciboActual.vereda}</p>
            <p><strong>Finca:</strong> {reciboActual.finca}</p>
          </div>
          <hr />
          <div style={{ marginBottom: 12 }}>
            <p><strong>Kilos comprados:</strong> {reciboActual.kilos} kg</p>
            <p><strong>Valor por kilo:</strong> ${parseFloat(reciboActual.precio_kilo).toLocaleString("es-CO")}</p>
            <p style={{ fontSize: 20, color: "#1a5c38" }}><strong>TOTAL A PAGAR: ${parseFloat(reciboActual.total).toLocaleString("es-CO")}</strong></p>
          </div>
          {reciboActual.observaciones && <p><strong>Observaciones:</strong> {reciboActual.observaciones}</p>}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => window.print()} style={{ padding: "10px 24px", background:"#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", marginRight: 12 }}>Imprimir Recibo</button>
            <button onClick={() => setReciboActual(null)} style={{ padding: "10px 24px", background: "#ccc", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3>Nuevo registro</h3>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input placeholder="Buscar productor..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setMostrarSugerencias(true); setProductorSeleccionado(null); }} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
          {mostrarSugerencias && sugerencias.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ccc", borderRadius: 8, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
              {sugerencias.map(p => (
                <div key={p.id} onClick={() => seleccionarProductor(p)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                  {p.nombre} - {p.cedula}
                </div>
              ))}
            </div>
          )}
        </div>
        {productorSeleccionado && (
          <div style={{ marginBottom: 12, padding: 12, background: "#f0fff4", borderRadius: 8 }}>
            <p style={{ margin: 2, color: "#1a5c38" }}><strong>Cedula:</strong> {productorSeleccionado.cedula}</p>
            <p style={{ margin: 2, color: "#1a5c38" }}><strong>Telefono:</strong> {productorSeleccionado.telefono}</p>
            <p style={{ margin: 2, color: "#1a5c38" }}><strong>Finca:</strong> {productorSeleccionado.finca}</p>
            <p style={{ margin: 2, color: "#1a5c38" }}><strong>Vereda:</strong> {productorSeleccionado.vereda}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <input name="kilos" type="number" placeholder="Kilos" value={form.kilos} onChange={manejarCambio} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
          <input name="precio_kilo" type="number" placeholder="Precio por kilo" value={form.precio_kilo} onChange={manejarCambio} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
        </div>
        {form.kilos && form.precio_kilo && <p style={{ color: "#1a5c38", fontWeight: "bold", marginBottom: 12 }}>Total: ${(parseFloat(form.kilos) * parseFloat(form.precio_kilo)).toLocaleString("es-CO")}</p>}
        <textarea name="observaciones" placeholder="Observaciones" value={form.observaciones} onChange={manejarCambio} style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box", minHeight: 80 }} />
        <button onClick={guardarAcopio} disabled={cargando} style={{ width: "100%", padding: 12, background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>{cargando ? "Guardando..." : "Guardar Acopio"}</button>
        {mensaje && <p style={{ marginTop: 12, textAlign: "center", color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}</p>}
      </div>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <h3>Registros recientes</h3>
        {registros.length === 0 ? <p style={{ color: "#999" }}>No hay registros.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f5f5f5" }}><th style={{ padding: 8, textAlign: "left" }}>Productor</th><th style={{ padding: 8, textAlign: "left" }}>Kilos</th><th style={{ padding: 8, textAlign: "left" }}>Precio/kg</th><th style={{ padding: 8, textAlign: "left" }}>Total</th><th style={{ padding: 8, textAlign: "left" }}>Fecha</th></tr></thead>
            <tbody>{registros.map((r) => (<tr key={r.id}><td style={{ padding: 8 }}>{r.productor}</td><td style={{ padding: 8 }}>{r.kilos}</td><td style={{ padding: 8 }}>${r.precio_kilo}</td><td style={{ padding: 8 }}>${r.total}</td><td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleDateString("es-CO")}</td></tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Acopio;