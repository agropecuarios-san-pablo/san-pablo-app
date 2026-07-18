import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// NOTA: Se eliminaron html2canvas y print.css para evitar que el iPhone fuerce el formato Carta (AirPrint)

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

  useEffect(() => {
    cargarProductores();
    cargarRegistros();
  }, []);

  const cargarProductores = async () => {
    const { data } = await supabase.from("productores").select("*").order("nombre");
    if (data) setProductores(data);
  };

  const cargarRegistros = async () => {
    const { data } = await supabase.from("acopios").select("*").order("created_at", { ascending: false });
    if (data) setRegistros(data);
  };

  const sugerencias = productores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) && busqueda.length > 0
  );

  const seleccionarProductor = (p) => {
    setProductorSeleccionado(p);
    setBusqueda(p.nombre);
    setMostrarSugerencias(false);
  };

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
  };

  const guardarAcopio = async () => {
    if (!productorSeleccionado || !form.kilos || !form.precio_kilo) {
      setMensaje("Selecciona un productor y completa los campos.");
      return;
    }
    setCargando(true);
    const datos = {
      productor: productorSeleccionado.nombre,
      cedula: productorSeleccionado.cedula,
      telefono: productorSeleccionado.telefono,
      vereda: productorSeleccionado.vereda,
      finca: productorSeleccionado.finca,
      kilos: parseFloat(form.kilos),
      precio_kilo: parseFloat(form.precio_kilo),
      total: parseFloat(form.kilos) * parseFloat(form.precio_kilo),
      observaciones: form.observaciones
    };

    if (editandoId) {
      const { error } = await supabase.from("acopios").update(datos).eq("id", editandoId);
      if (error) setMensaje("Error: " + error.message);
      else {
        setMensaje("Acopio actualizado.");
        setEditandoId(null);
        setBusqueda("");
        setProductorSeleccionado(null);
        setForm({ kilos: "", precio_kilo: "", observaciones: "" });
        cargarRegistros();
      }
    } else {
      const { data, error } = await supabase.from("acopios").insert([{ ...datos, usuario_id: usuario.id }]).select();
      if (error) setMensaje("Error: " + error.message);
      else {
        setMensaje("Acopio registrado.");
        setReciboActual(data[0]);
        setForm({ kilos: "", precio_kilo: "", observaciones: "" });
        setBusqueda("");
        setProductorSeleccionado(null);
        cargarRegistros();
      }
    }
    setCargando(false);
  };

  const eliminarAcopio = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    await supabase.from("acopios").delete().eq("id", id);
    cargarRegistros();
  };

  // --- FUNCIÓN DE IMPRESIÓN ASÍNCRONA PARA TU XPRINTER ---
  const mandarAXprinter = async (r) => {
    if (!r) return;

    // Construcción del texto plano estructurado compatible con el ancho de 80mm
    const textoTicket = 
      `AGROPECUARIOS SAN PABLO\n` +
      `Sistema de Acopio de Cacao\n` +
      `================================\n` +
      `        RECIBO DE COMPRA        \n\n` +
      `Fecha: ${new Date(r.created_at || Date.now()).toLocaleDateString("es-CO")}\n` +
      `Hora: ${new Date(r.created_at || Date.now()).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `Productor: ${r.productor || "N/A"}\n` +
      `Cedula: ${r.cedula || "N/A"}\n` +
      `Telefono: ${r.telefono || "N/A"}\n` +
      `Vereda: ${r.vereda || "N/A"}\n` +
      `Finca: ${r.finca || "N/A"}\n` +
      `--------------------------------\n` +
      `Kilos comprados: ${r.kilos || 0} kg\n` +
      `Valor por kilo: $${parseFloat(r.precio_kilo || 0).toLocaleString("es-CO")}\n\n` +
      `TOTAL A PAGAR: $${parseFloat(r.total || 0).toLocaleString("es-CO")}\n` +
      (r.observaciones ? `Obs: ${r.observaciones}\n` : "") +
      `================================\n` +
      `   ¡Gracias por su confianza!   \n\n\n`;

    // Activa el menú de compartir de iOS para transferir el texto directamente a la App Xprinter
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Recibo_${r.cedula}`,
          text: textoTicket
        });
      } catch (error) {
        console.log("Impresión cancelada o fallida:", error);
      }
    } else {
      // Descarga de respaldo en PC de escritorio
      const blob = new Blob([textoTicket], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `recibo_cacao_${r.id || "ticket"}.txt`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    }
  };

  // --- FUNCIÓN INDEPENDIENTE PARA COMPARTIR POR WHATSAPP ---
  const enviarPorWhatsApp = (r) => {
    if (!r) return;
    const textoMensaje = 
      `*AGROPECUARIOS SAN PABLO*\n` +
      `*Sistema de Acopio de Cacao*\n` +
      `================================\n` +
      `*RECIBO DE COMPRA*\n\n` +
      `*Fecha:* ${new Date(r.created_at || Date.now()).toLocaleDateString("es-CO")}\n` +
      `*Productor:* ${r.productor}\n` +
      `*Cédula:* ${r.cedula}\n` +
      `*Kilos:* ${r.kilos} kg\n` +
      `*Precio Kilo:* $${parseFloat(r.precio_kilo).toLocaleString("es-CO")}\n` +
      `*TOTAL A PAGAR:* $${parseFloat(r.total).toLocaleString("es-CO")}\n` +
      `================================\n` +
      `¡Gracias por su confianza!`;

    const textoUrl = encodeURIComponent(textoMensaje);
    const telefono = r.telefono ? r.telefono.replace(/\D/g, "") : "";
    const url = telefono ? `https://wa.me{telefono}?text=${textoUrl}` : `https://wa.me{textoUrl}`;
    window.open(url, "_blank");
  };

  const registrosFiltrados = registros.filter(r => r.productor.toLowerCase().includes(busquedaRegistros.toLowerCase()));
  const hoy = registros.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString());
  const kilosHoy = hoy.reduce((sum, r) => sum + parseFloat(r.kilos || 0), 0);
  const totalPagadoHoy = hoy.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
      {/* Tarjetas de estadísticas superiores */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#1a5c38", color: "#fff", padding: 20, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>Kilos hoy</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: "bold" }}>{kilosHoy.toFixed(1)} kg</p>
        </div>
        <div style={{ flex: 1, background: "#2b6cb0", color: "#fff", padding: 20, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>Total pagado hoy</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: "bold" }}>${totalPagadoHoy.toLocaleString("es-CO")}</p>
        </div>
        <div style={{ flex: 1, background: "#744210", color: "#fff", padding: 20, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>Compras hoy</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: "bold" }}>{hoy.length}</p>
        </div>
      </div>

      {/* Recibo Activo en Pantalla */}
      {reciboActual && (
        <div id="recibo-imprimible" ref={reciboRef} style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 16, border: "2px solid #1a5c38", position: "relative" }}>
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
            <p><strong>Kilos comprados:</strong> {reciboActual.kilos} kg</p> Valor por kilo: ${parseFloat(reciboActual.precio_kilo).toLocaleString("es-CO")}<p style={{ fontSize: 20, color: "#1a5c38" }}>TOTAL A PAGAR: ${parseFloat(reciboActual.total).toLocaleString("es-CO")}{reciboActual.observaciones && Observaciones: {reciboActual.observaciones}}{/* TUS TRES BOTONES TOTALMENTE CONSERVADOS E INDEPENDIENTES */}<div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}><button onClick={() => mandarAXprinter(reciboActual)} style={{ flex: 1, padding: "10px 16px", background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Imprimir<button onClick={() => enviarPorWhatsApp(reciboActual)} style={{ flex: 1, padding: "10px 16px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Compartir WhatsApp<button onClick={() => setReciboActual(null)} style={{ flex: 1, padding: "10px 16px", background: "#ccc", color: "#2b6cb0", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>Cerrar)}{/* Formulario de Captura de Datos */}<div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>{editandoId ? "Editar acopio" : "Nuevo registro"}<div style={{ position: "relative", marginBottom: 12 }}><input placeholder="Buscar productor..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setMostrarSugerencias(true); }} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />{mostrarSugerencias && sugerencias.length > 0 && (<div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ccc", borderRadius: 8, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>{sugerencias.map(p => (<div key={p.id} onClick={() => seleccionarProductor(p)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #eee" }}>{p.nombre} - {p.cedula}))})}{productorSeleccionado && (<div style={{ marginBottom: 12, padding: 12, background: "#f0f7f4", borderRadius: 8 }}><p style={{ margin: 2, color: "#1a5c38" }}>Cédula: {productorSeleccionado.cedula}<p style={{ margin: 2, color: "#1a5c38" }}>Teléfono: {productorSeleccionado.telefono}<p style={{ margin: 2, color: "#1a5c38" }}>Finca: {productorSeleccionado.finca}<p style={{ margin: 2, color: "#1a5c38" }}>Vereda: {productorSeleccionado.vereda})}<div style={{ display: "flex", gap: 12, marginBottom: 12 }}><input name="kilos" type="number" placeholder="Kilos" value={form.kilos} onChange={manejarCambio} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }} /><input name="precio_kilo" type="number" placeholder="Precio por kilo" value={form.precio_kilo} onChange={manejarCambio} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />{form.kilos && form.precio_kilo && (<p style={{ color: "#1a5c38", fontWeight: "bold", marginBottom: 12 }}>Total: ${(parseFloat(form.kilos) * parseFloat(form.precio_kilo)).toLocaleString("es-CO")})}<textarea name="observaciones" placeholder="Observaciones" value={form.observaciones} onChange={manejarCambio} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc" }} /><div style={{ display: "flex", gap: 12 }}><button onClick={guardarAcopio} disabled={cargando} style={{ flex: 1, padding: 12, background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>{cargando ? "Guardando..." : editandoId ? "Actualizar Acopio" : "Guardar Acopio"}{editandoId && <button onClick={cancelarEdicion} style={{ flex: 1, padding: 12, background: "#ccc", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>Cancelar}{mensaje && <p style={{ marginTop: 12, textAlign: "center", color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}}{/* Historial de Registros de la Tabla Baja */}<div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>Registros recientes<input placeholder="Buscar por nombre de productor..." value={busquedaRegistros} onChange={(e) => setBusquedaRegistros(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc" }} />{registrosFiltrados.length === 0 ? <p style={{ color: "#999" }}>No hay registros. : ()});}export default Acopio;
