import React, { useState, useContext } from "react";
import { ContextoUsuario } from "./ContextoUsuario";
import { useNavigate, Link } from "react-router-dom";



const API_URL = "https://rutas-a7bdc4cbead4.herokuapp.com";

function parseJwt<T = any>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
export function InicioSesion() {
  const { iniciarSesion } = useContext(ContextoUsuario);
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Login tradicional
  const manejarInicio = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    try {
      const respuesta = await fetch("https://rutas-a7bdc4cbead4.herokuapp.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailUsuario: correo,
          contrasenaUsuario: contrasena,
        }),
      }
      );

      if (!respuesta.ok) {
        throw new Error("Credenciales incorrectas");
      }

      const data = await respuesta.json();

      const token = data.token;
      const usuario = data.usuario;

      if (token) localStorage.setItem("token", token);

      const payload = parseJwt<any>(token) || {};
    const idUsuario =
      payload.idUsuario ?? payload.userId ?? payload.id ?? payload.sub ?? null;

      if (idUsuario != null) localStorage.setItem("idUsuario", String(idUsuario));


      // Guardar usuario en el contexto con fallback seguro para nombreUsuario
      iniciarSesion(
        data.usuario
          ? {
            ...data.usuario,
            nombreUsuario:
              data.usuario.nombreUsuario ||
              data.usuario.emailUsuario?.split("@")[0] ||
              correo.split("@")[0] ||
              "Usuario"
          }
          : {
            emailUsuario: correo,
            nombreUsuario: correo.split("@")[0] || "Usuario"
          },
        data.token
      );

      navigate("/home"); // Redirige al panel principal
    } catch (error) {
      alert("Correo o contraseña incorrectos");
    }
  };


  // Login con Google
  const manejarGoogleRedirect = () => {
    // inicia el flujo OAuth2 en el backend
    window.location.href = `http://localhost:6090/oauth2/authorization/google`;
  };

  return (
  <div className="d-flex vh-100">
    {/* Lado izquierdo: formulario */}
    <div
      style={{
        flex: "0 0 30%", // 30% ancho
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>

        <form onSubmit={manejarInicio}>
          <div className="mb-3">
            <input
              className="form-control"
              placeholder="Correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              className="form-control"
              placeholder="Contraseña"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success w-100">
            Entrar
          </button>
        </form>

        <div className="my-3 d-flex justify-content-center">
          <button
            type="button"
            className="btn btn-outline-primary w-100"
            onClick={manejarGoogleRedirect}
          >
            <img
              alt="Google"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              style={{ width: 18, marginRight: 8, verticalAlign: "text-bottom" }}
            />
            Ingresar con Google
          </button>
        </div>

        <p className="text-center mt-3">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>

    {/* Lado derecho: imagen con overlay */}
    <div
      style={{
        flex: "0 0 70%", // 70% ancho
        backgroundImage: "url('/map.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Contenedor ovalado */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderRadius: "50px",
          padding: "30px 50px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
        }}
      >
        <h2 style={{ color: "#2e7d32", marginBottom: "10px" }}>🌱 Bienvenido de nuevo</h2>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
          “Conéctate, sigue sumando rutas y cuidemos el planeta juntos”
        </p>
      </div>
    </div>
  </div>
);



}
