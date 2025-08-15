import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ContextoUsuario } from "./ContextoUsuario";

export function Registro() {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [contrasenaUsuario, setContrasenaUsuario] = useState("");
  const navigate = useNavigate();
  const { iniciarSesion } = useContext(ContextoUsuario);

  const manejarRegistro = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await fetch(
        "https://rutas-a7bdc4cbead4.herokuapp.com/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nombres,
            apellidos,
            identificacion,
            nombreUsuario,
            emailUsuario,
            contrasenaUsuario
          })
        }
      );

      if (!respuesta.ok) {
        throw new Error("Error en el registro");
      }

      const data = await respuesta.json();

      iniciarSesion(data.usuario, data.token);
      navigate("/home");
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema con el registro.");
    }
  };

  return (
    <div className="d-flex vh-100">
      {/* Lado izquierdo: formulario ovalado */}
      <div
        style={{
          flex: "0 0 35%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f7f1"
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "25px", // bordes ovalados
            padding: "30px 25px",
            width: "360px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
          }}
        >
          <h2 className="text-center mb-2" style={{ color: "#2e7d32" }}>
            🌱 EcoRuta
          </h2>
          <p
            className="text-center text-muted mb-4"
            style={{ fontStyle: "italic", fontSize: "14px" }}
          >
            “Cada ruta cuenta, suma puntos y cuida el planeta”
          </p>

          <h4 className="text-center mb-3">Registro</h4>
          <form onSubmit={manejarRegistro}>
            <input
              className="form-control mb-3"
              placeholder="Nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              placeholder="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              placeholder="Identificación"
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              placeholder="Nombre de Usuario"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              type="email"
              placeholder="Correo Electrónico"
              value={emailUsuario}
              onChange={(e) => setEmailUsuario(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              type="password"
              placeholder="Contraseña"
              value={contrasenaUsuario}
              onChange={(e) => setContrasenaUsuario(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn w-100"
              style={{ backgroundColor: "#2e7d32", color: "white" }}
            >
              Registrarse
            </button>
          </form>

          <p className="text-center mt-3">
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" style={{ color: "#2e7d32", fontWeight: "bold" }}>
              Iniciar Sesión
            </a>
          </p>
        </div>
      </div>

      {/* Lado derecho: imagen con overlay */}
<div
  style={{
    flex: "0 0 65%",
    backgroundImage: "url('/map.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative"
  }}
>
  {/* Contenedor ovalado con frase */}
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
    <h2 style={{ color: "#2e7d32", marginBottom: "10px" }}>🌍 EcoRuta</h2>
    <p style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
      “Planifica tus rutas, gana puntos y ayuda al planeta”
    </p>
  </div>
</div>

    </div>
  );
}
