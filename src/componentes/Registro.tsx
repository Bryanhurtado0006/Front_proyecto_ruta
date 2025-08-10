import React, { useState, useContext } from "react";
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
            const respuesta = await fetch("https://rutas-a7bdc4cbead4.herokuapp.com/auth/register", {
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
            });

            if (!respuesta.ok) {
                throw new Error("Error en el registro");
            }

            const data = await respuesta.json();
            console.log("Registro exitoso:", data);

            // Aquí guardamos usuario y token en el contexto
            iniciarSesion( data.usuario ??
                { 
                    // igual que el login, mejor usemos los datos que me 
                    // devuelvan en el backend, en vez de reconstruir el objeto
                    nombres,
                    apellidos,
                    identificacion,
                    nombreUsuario,
                    emailUsuario
                },
                data.token // el token que devuelve el backend
            );

            // Ir directo al dashboard
            navigate("/home");
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un problema con el registro.");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow" style={{ width: "350px" }}>
                <h2 className="text-center mb-4">Registro</h2>
                <form onSubmit={manejarRegistro}>
                    <input className="form-control mb-3" placeholder="Nombres"
                        value={nombres} onChange={(e) => setNombres(e.target.value)} required />
                    <input className="form-control mb-3" placeholder="Apellidos"
                        value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
                    <input className="form-control mb-3" placeholder="Identificación"
                        value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} required />
                    <input className="form-control mb-3" placeholder="Nombre de Usuario"
                        value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} required />
                    <input className="form-control mb-3" type="email" placeholder="Correo Electrónico"
                        value={emailUsuario} onChange={(e) => setEmailUsuario(e.target.value)} required />
                    <input className="form-control mb-3" type="password" placeholder="Contraseña"
                        value={contrasenaUsuario} onChange={(e) => setContrasenaUsuario(e.target.value)} required />
                    <button type="submit" className="btn btn-primary w-100">
                        Registrarse
                    </button>
                </form>
            </div>
        </div>
    );
}
