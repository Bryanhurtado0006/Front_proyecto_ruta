// src/pages/LoginSuccess.tsx
import { useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ContextoUsuario } from "./ContextoUsuario";


const EFFECT_GUARD_KEY = "login_success_ran";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeJwtPayload(token: string){
  try {
    const base64 = token.split(".")[1];
    // compat URL-safe base64
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function LoginSuccess() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { iniciarSesion } = useContext(ContextoUsuario);
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;           // bloquea re-ejecución en mismo montaje
    didRunRef.current = true;

    // bloqueo adicional contra StrictMode (nuevo montaje “fantasma”):
    if (sessionStorage.getItem(EFFECT_GUARD_KEY) === "1") return;
    sessionStorage.setItem(EFFECT_GUARD_KEY, "1");
    
    const qs = new URLSearchParams(search);
    const token = qs.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // 1) Guarda el token ya mismo
    localStorage.setItem("token", token);

    // 2) Usuario provisional desde el payload del JWT (redirección rápida)
    const payload = decodeJwtPayload(token);
    const email = payload?.email ?? payload?.sub ?? "desconocido@local";
    const nombre = payload?.name ?? (email.includes("@") ? email.split("@")[0] : "Usuario");

    iniciarSesion({ emailUsuario: email, nombreUsuario: nombre }, token);

    // Limpia el token de la URL (opcional, estética)
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);

    // 3) Navega una sola vez al home
    navigate("/home", { replace: true });

    // 4) En segundo plano, refina el perfil llamando /me (sin navegar otra vez)
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(`http://localhost:6090/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) return;
        const me = await resp.json();
        if (cancelled) return;
        iniciarSesion(
          {
            emailUsuario: me?.email ?? me?.username ?? email,
            nombreUsuario: me?.name ?? me?.fullName ?? nombre,
          },
          token
        );
      } catch (error) {
        console.error("Error al obtener perfil:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, iniciarSesion, navigate]);

  return <p style={{ padding: 24 }}>Procesando inicio de sesión…</p>;
}
