import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import html2canvas from "html2canvas";
import "./print.css";

function Acopio({ usuario }) {
  const [form, setForm] = useState({ kilos: "", precio_kilo: "", observaciones: "" });
  const [productores, setProductores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaRegistros, setBusquedaRegistros] = useState("");
  const [productorSeleccionado, setProductorSeleccionado] = useState(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [reciboActual, setReciboActual] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const reciboRef = useRef(null);

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

  const editarAcopio = (r) => {
    setEditandoId(r.id);
    setBusqueda(r.productor);
    setProductorSeleccionado({ nombre: r.productor, cedula: r.cedula, telefono: r.telefono, vereda: r.vereda, finca: r.finca });
    setForm({ kilos: r.kilos, precio_kilo: r.precio_kilo, observaciones: r.observaciones || "" });
    window.scrollTo(0, 0);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setBusqueda("");
    setProductorSeleccionado(null);
    setForm({ kilos: "", precio_kilo: "", observaciones: "" });
    setMensaje("");
  };

  const guardarAcopio = async () => {
    if (!productorSeleccionado || !form.kilos || !form.precio_kilo) { setMensaje("Selecciona un productor y completa los campos."); return; }
    setCargando(true);
    const datos = {
      productor: productorSeleccionado.nombre, cedula: productorSeleccionado.cedula,
      telefono: productorSeleccionado.telefono, vereda: productorSeleccionado.vereda,
      finca: productorSeleccionado.finca, kilos: parseFloat(form.kilos),
      precio_kilo: parseFloat(form.precio_kilo),
      total: parseFloat(form.kilos) * parseFloat(form.precio_kilo),
      observaciones: form.observaciones
    };
    if (editandoId) {
      const { error } = await supabase.from("acopios").update(datos).eq("id", editandoId);
      if (error) { setMensaje("Error: " + error.message); }
      else { setMensaje("Acopio actualizado."); setEditandoId(null); setBusqueda(""); setProductorSeleccionado(null); setForm({ kilos: "", precio_kilo: "", observaciones: "" }); cargarRegistros(); }
    } else {
      const { data, error } = await supabase.from("acopios").insert([{ ...datos, usuario_id: usuario.id }]).select();
      if (error) { setMensaje("Error: " + error.message); }
      else { setMensaje("Acopio registrado."); setReciboActual(data[0]); setForm({ kilos: "", precio_kilo: "", observaciones: "" }); setBusqueda(""); setProductorSeleccionado(null); cargarRegistros(); }
    }
    setCargando(false);
  };

  const eliminarAcopio = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    await supabase.from("acopios").delete().eq("id", id);
    cargarRegistros();
  };

  const compartirEImprimir = async (r) => {
    const elemento = reciboRef.current;
    if (!elemento) return;
    
    try {
      const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: "#ffffff" });
      const imagen = canvas.toDataURL("image/png");
      const blob = await (await fetch(imagen)).blob();
      const file = new File([blob], "recibo_san_pablo.png", { type: "image/png" });

      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const esMovil = /iPad|iPhone|iPod|android/i.test(userAgent);

      if (esMovil && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ 
          files: [file], 
          title: "Recibo Agropecuarios San Pablo",
          text: "Imprimir comprobante en Mini-Printer"
        });
      } else {
        const urlTemporal = URL.createObjectURL(file);
        window.open(urlTemporal, "_blank");
      }
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      const telefono = r.telefono ? r.telefono.replace(/\D/g, "") : "";
      const url = telefono ? `https://wa.me{telefono}` : `https://wa.me`;
      window.open(url, "_blank");
    }
  };

  const registrosFiltrados = registros.filter(r => r.productor.toLowerCase().includes(busquedaRegistros.toLowerCase()));
  const hoy = registros.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString());
  const kilosHoy = hoy.reduce((sum, r) => sum + parseFloat(r.kilos || 0), 0);
  const totalHoy = hoy.reduce((sum, r) => sum + parseFloat(r.total || 0), 0); return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#1a5c38", color: "#fff", padding: 20, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>Kilos hoy</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: "bold" }}>{kilosHoy.toFixed(1)} kg</p>
        </div>
        <div style={{ flex: 1, background: "#2b6cb0", color: "#fff", padding: 20, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>Total pagado hoy</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: "bold" }}>${totalHoy.toLocaleString("es-CO")}</p>
        </div>
        <div style={{ flex: 1, background: "#744210", color: "#fff", padding: 20, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>Compras hoy</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: "bold" }}>{hoy.length}</p>
        </div>
      </div>

      {reciboActual && (
        <div style={{ marginBottom: 30 }}>
          <div id="recibo-imprimible" ref={reciboRef} style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 16, border: "2px solid #1a5c38", position: "relative", overflow: "hidden" }}>
            <img
              src="/logo.jpg"
              alt=""
              className="marca-agua"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.12, zIndex: 0, pointerEvents: "none" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div style={{ position: "relative", zIndex: 1, color: "#000" }}>
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
                <p><strong>Cédula:</strong> {reciboActual.cedula}</p>
                <p><strong>Teléfono:</strong> {reciboActual.telefono}</p>
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
            </div>
         const compartirEImprimir = async (e, r) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const elemento = reciboRef.current;
    if (!elemento) return;
    
    try {
      // Captura la imagen del recibo en alta resolución
      const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: "#ffffff" });
      const imagenBase64 = canvas.toDataURL("image/png");

      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const esMovil = /iPad|iPhone|iPod|android/i.test(userAgent);

      if (esMovil) {
        // Codifica el PNG para enviarlo directo por la URL interna de iOS
        const imagenCodificada = encodeURIComponent(imagenBase64);
        
        // Comando directo que abre BR RawPrinter en el iPhone
        const esquemaiOS = `brrawprinter://print?base64=${imagenCodificada}`;
        window.location.href = esquemaiOS;
      } else {
        // Respaldo para PC: Abre la imagen en una pestaña limpia
        const blob = await (await fetch(imagenBase64)).blob();
        const urlTemporal = URL.createObjectURL(blob);
        window.open(urlTemporal, "_blank");
      }
    } catch (error) {
      console.error("Error al procesar la imagen para la ticketera:", error);
      alert("Hubo un problema al conectar con BR RawPrinter.");
    }
  };
      const telefono = r.telefono ? r.telefono.replace(/\D/g, "") : "";
      const url = telefono ? `

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h2 style={{ color: "#1a5c38", marginTop: 0 }}>{editandoId ? "Editar Registro" : "Nuevo Registro de Acopio"}</h2>
        {mensaje && <p style={{ color: mensaje.includes("Error") ? "#e53e3e" : "#38a169", fontWeight: "bold" }}>{mensaje}</p>}
        
        <div style={{ position: "relative", marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", color: "#4a5568" }}>Buscar Productor</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setMostrarSugerencias(true); }}
            placeholder="Escribe el nombre del productor..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e0", boxSizing: "border-box" }}
            disabled={editandoId !== null}
          />
          {mostrarSugerencias && sugerencias.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e0", borderRadius: 6, padding: 0, margin: "4px 0 0 0", listStyle: "none", zIndex: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>
              {sugerencias.map(p => (
                <li key={p.id} onClick={() => seleccionarProductor(p)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #edf2f7" }} onMouseEnter={(e) => e.target.style.background = "#f7fafc"} onMouseLeave={(e) => e.target.style.background = "#fff"}>
                  {p.nombre} - CC: {p.cedula}
                </li>
              ))}
            </ul>
          )}
        </div>

        {productorSeleccionado && (
          <div style={{ background: "#f7fafc", padding: 14, borderRadius: 6, marginBottom: 16, borderLeft: "4px solid #1a5c38" }}>
            <p style={{ margin: "2px 0" }}><strong>Productor:</strong> {productorSeleccionado.nombre}</p>
            <p style={{ margin: "2px 0" }}><strong>Cédula:</strong> {productorSeleccionado.cedula}</p>
            <p style={{ margin: "2px 0" }}><strong>Finca:</strong> {productorSeleccionado.finca} ({productorSeleccionado.vereda})</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", color: "#4a5568" }}>Kilos</label>
            <input type="number" name="kilos" value={form.kilos} onChange={manejarCambio} placeholder="0.0" style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e0", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", color: "#4a5568" }}>Precio por Kilo</label>
            <input type="number" name="precio_kilo" value={form.precio_kilo} onChange={manejarCambio} placeholder="$" style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e0", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", color: "#4a5568" }}>Observaciones (Opcional)</label>
          <textarea name="observaciones" value={form.observaciones} onChange={manejarCambio} placeholder="Detalles del grano, humedad, etc..." rows="2" style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e0", boxSizing: "border-box", resize: "none" }}></textarea>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={guardarAcopio} disabled={cargando} style={{ flex: 1, padding: "12px", background: "#1a5c38", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>
            {cargando ? "Guardando..." : editandoId ? "Actualizar Registro" : "Guardar Acopio"}
          </button>
          {editandoId && (
            <button onClick={cancelarEdicion} style={{ padding: "12px 20px", background: "#718096", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 style={{ color: "#2d3748" }}>Historial de Registros</h3>
        <input type="text" placeholder="Filtrar por productor..." value={busquedaRegistros} onChange={(e) => setBusquedaRegistros(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e0", marginBottom: 16, boxSizing: "border-box" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {registrosFiltrados.map(r => (
            <div key={r.id} style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#2d3748" }}>{r.productor}</h4>
                <p style={{ margin: 0, fontSize: 13, color: "#718096" }}>{r.kilos} kg | ${parseFloat(r.precio_kilo).toLocaleString("es-CO")}/kg</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, fontWeight: "bold", color: "#1a5c38" }}>Total: ${parseFloat(r.total).toLocaleString("es-CO")}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setReciboActual(r)} style={{ padding: "6px 12px", background: "#edf2f7", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>Ver Recibo</button>
                <button onClick={() => editarAcopio(r)} style={{ padding: "6px 12px", background: "#feebc8", color: "#c05621", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>Editar</button> <button onClick={() => eliminarAcopio(r.id)} style={{ padding: "6px 12px", background: "#fed7d7", color: "#9b2c2c", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>X))});}export default Acopio;
