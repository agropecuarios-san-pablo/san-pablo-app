import React, { useState } from "react";
import { supabase } from "./supabase";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [esRegistro, setEsRegistro] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async () => {
    setCargando(true);
    setMensaje("");
    if (esRegistro) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMensaje("Error: " + error.message);
      else setMensaje("Registro exitoso! Revisa tu correo para confirmar.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMensaje("Error: " + error.message);
      else onLogin(data.user);
    }
    setCargando(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 32, borderRadius: 12, boxShadow: "0 2px 16px #0001", background: "#fff" }}>
      <h2 style={{ color: "#1a5c38", textAlign: "center" }}>Agropecuarios San Pablo</h2>
      <p style={{ textAlign: "center", color: "#666" }}>{esRegistro ? "Crear cuenta" : "Iniciar sesion"}</p>
      <input type="email" placeholder="Correo electronico" value={email} onChange={e => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
      <input type="password" placeholder="Contrasena" value={password} onChange={e => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
      <button onClick={manejarEnvio} disabled={cargando}
        style={{ width: "100%", padding: 12, background: "#1a5c38", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>
        {cargando ? "Cargando..." : esRegistro ? "Registrarse" : "Entrar"}
      </button>
      {mensaje && <p style={{ marginTop: 12, textAlign: "center", color: mensaje.includes("Error") ? "red" : "green" }}>{mensaje}</p>}
      <p style={{ textAlign: "center", marginTop: 16, color: "#666", cursor: "pointer" }} onClick={() => setEsRegistro(!esRegistro)}>
        {esRegistro ? "Ya tienes cuenta? Inicia sesion" : "No tienes cuenta? Registrate"}
      </p>
    </div>
  );
}

export default Login;