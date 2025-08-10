import React, { createContext, useState, useEffect } from "react";

export const ContextoUsuario = createContext();

export function ProveedorUsuario({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState(null);

    // Al cargar la app, revisa si hay token y usuario guardados
    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuario");
        const tokenGuardado = localStorage.getItem("token");

        if (usuarioGuardado && tokenGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
            setToken(tokenGuardado);
        }
    }, []);

    // Iniciar sesión o registrar usuario (guardar datos y token)
    const iniciarSesion = (datosUsuario, tokenRecibido) => {
        setUsuario(datosUsuario);
        setToken(tokenRecibido);

        localStorage.setItem("usuario", JSON.stringify(datosUsuario));
        localStorage.setItem("token", tokenRecibido);
    };

    // Cerrar sesión (limpiar datos y token)
    const cerrarSesion = () => {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
    };

    // Función helper para peticiones protegidas
    const fetchProtegido = async (url, opciones = {}) => {
        if (!token) throw new Error("No hay token, usuario no autenticado");

        const resp = await fetch(url, {
            ...opciones,
            headers: {
                ...opciones.headers,
                Authorization: `Bearer ${token}`
            }
        });

        return resp;
    };

    return (
        <ContextoUsuario.Provider value={{ usuario, token, iniciarSesion, cerrarSesion, fetchProtegido }}>
            {children}
        </ContextoUsuario.Provider>
    );
}
