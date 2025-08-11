import React, { createContext, useState } from "react";

export const ContextoUsuario = createContext();
// contexto global, guardamos y compartimos info del usuario y su token

export function ProveedorUsuario({ children }) {
    // guardamos name, email etc del user
    const [usuario, setUsuario] = useState(() => {
        try {
            const usuarioGuardado = localStorage.getItem("usuario");
            return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
        } catch (e) {
            console.error("Error leyendo usuario del localStorage", e);
            return null;
        }
    });

    // recibimos el token del back para validar las peticiones
    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || null;
    });

    // guardamos en memoria (useState) y en el almacenamiento (LocalStorage) user y token
    // después de un logueo exitoso
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
