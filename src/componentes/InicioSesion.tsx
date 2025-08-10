import React, { useState, useContext } from "react";
import { ContextoUsuario } from "./ContextoUsuario";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export function InicioSesion() {
  const { iniciarSesion } = useContext(ContextoUsuario);
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Login tradicional
  const manejarInicio = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await fetch(
        "https://rutas-a7bdc4cbead4.herokuapp.com/auth/login",
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
      iniciarSesion(data.usuario ?? { emailUsuario: correo }, data.token);
      navigate("/home");
    } catch (error) {
      alert("Correo o contraseña incorrectos");
    }
  };

  // Login con Google
  const manejarGoogleLogin = async (credentialResponse) => {
    try {
      // credentialResponse.credential es el token JWT que entrega Google
      const respuesta = await fetch(
        "https://rutas-a7bdc4cbead4.herokuapp.com/auth/google-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tokenGoogle: credentialResponse.credential }),
        }
      );

      if (!respuesta.ok) {
        throw new Error("Error autenticando con Google");
      }

      const data = await respuesta.json();
      iniciarSesion(data.usuario, data.token);
      navigate("/home");
    } catch (error) {
      alert("Error al iniciar sesión con Google");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
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
          <GoogleLogin
            onSuccess={manejarGoogleLogin}
            onError={() => alert("Error al iniciar sesión con Google")}
          />
        </div>

        <p className="text-center mt-3">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
