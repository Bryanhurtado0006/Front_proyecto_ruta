import React, { useState, useContext } from "react";
import { ContextoUsuario } from "./ContextoUsuario";
import { useNavigate, Link } from "react-router-dom";



const API_URL = "https://rutas-a7bdc4cbead4.herokuapp.com";
export function InicioSesion() {
  const { iniciarSesion } = useContext(ContextoUsuario);
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Login tradicional
  const manejarInicio = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    try {
      const respuesta = await fetch(
        "http://localhost:6090/auth/login",
        {
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

    {/* Lado derecho: imagen */}
    <div
      style={{
        flex: "0 0 70%", // 70% ancho
        backgroundImage: "url('/map.jpg')", // si está en public, solo usa '/map.jpg'
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    ></div>
  </div>
);


}
