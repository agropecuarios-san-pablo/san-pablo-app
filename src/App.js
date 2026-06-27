import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import Acopio from "./Acopio";
import Productores from "./Productores";
import Reportes from "./Reportes";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState("acopio");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      setCargando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  if (cargando) return <p>Cargando...</p>;
  if (!usuario) return <Login onLogin={setUsuario} />;

  return (
    <div>
      <nav style={{ background: "#1a5c38", padding: "12px 24px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <button onClick={() => setPantalla("acopio")} style={{ marginRight: 8, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: pantalla === "acopio" ? "#fff" : "#2d7a4f", color: pantalla === "acopio" ? "#1a5c38" : "#fff" }}>Acopio</button>
          <button onClick={() => setPantalla("productores")} style={{ marginRight: 8, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: pantalla === "productores" ? "#fff" : "#2d7a4f", color: pantalla === "productores" ? "#1a5c38" : "#fff" }}>Productores</button>
          <button onClick={() => setPantalla("reportes")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: pantalla === "reportes" ? "#fff" : "#2d7a4f", color: pantalla === "reportes" ? "#1a5c38" : "#fff" }}>Reportes</button>
        </div>
        <button onClick={cerrarSesion} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", background: "transparent", color: "#fff", border: "1px solid #fff" }}>Cerrar sesion</button>
      </nav>
      {pantalla === "acopio" && <Acopio usuario={usuario} />}
      {pantalla === "productores" && <Productores onVolver={() => setPantalla("acopio")} />}
      {pantalla === "reportes" && <Reportes />}
    </div>
  );
}

export default App;