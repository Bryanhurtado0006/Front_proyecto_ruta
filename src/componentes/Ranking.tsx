// src/componentes/Ranking.jsx
import React, { useState, useEffect, useContext } from "react";
import { ContextoUsuario } from "./ContextoUsuario";
import "../Ranking.css";

type RankingItem = {
  idUsuario: number;
  nombreUsuario: string;
  puntosTotales: number;
};

export default function Ranking() {
  const { usuario } = useContext(ContextoUsuario);
  const [recompensa, setRecompensa] = useState("");
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [puntos, setPuntos] = useState<number>(0);

  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Sistema de recompensas reales
  const calcularRecompensa = (pts: number) => {
    if (pts < 50) return "🔒 Aún sin recompensa. ¡Sigue acumulando!";
    if (pts >= 50 && pts < 100) return "🎁 5% de descuento en Éxito";
    if (pts >= 100 && pts < 150) return "🎁 10% de descuento en Jumbo";
    if (pts >= 150 && pts < 200) return "🎁 Bono de $20,000 en Alkosto";
    if (pts >= 250) return "🎉 Bono de $50,000 en Éxito o Jumbo";
  };

  useEffect(() => {
 

    (async () => {
      try {
        setCargando(true);
        setError("");

        const token = localStorage.getItem("token") ?? "";
        const resp = await fetch("https://rutas-a7bdc4cbead4.herokuapp.com/user/ranking", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },

        });

        if (resp.status === 401 || resp.status === 403) {
          throw new Error("No autorizado. Inicia sesión nuevamente.");
        }
        if (!resp.ok) {
          const t = await resp.text().catch(() => "");
          throw new Error(t || `Error HTTP ${resp.status}`);
        }

        const data: RankingItem[] = await resp.json();

        // Si el backend no viene ordenado, ordénalo por puntos desc:
        data.sort((a, b) => b.puntos - a.puntos);

        setRanking(data);

        // Actualiza UI del usuario logueado
        const idRaw = localStorage.getItem("idUsuario");
        const idUsuario = idRaw ? Number(idRaw) : null;

        if (idUsuario != null) {
          const yo = data.find((u) => u.idUsuario === idUsuario);
          const pts = yo ? yo.puntos : Number(localStorage.getItem("puntosUsuario") || "0");
          setPuntos(pts);
          setRecompensa(calcularRecompensa(pts));
        } else {
          // fallback si no hay idUsuario en localStorage
          const ptsGuardados = Number(localStorage.getItem("puntosUsuario") || "0");
          setPuntos(ptsGuardados);
          setRecompensa(calcularRecompensa(ptsGuardados));
        }
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar el ranking");
      } finally {
        setCargando(false);
      }
    })();

  
  }, []);

  // Si tienes usuario en contexto:
  // const { usuario } = useAuth();
  // const usuario = { nombreUsuario: localStorage.getItem("nombreUsuario") || "Invitado" };

  if (cargando) return <div className="contenedor">Cargando ranking…</div>;
  if (error) return <div className="contenedor">Error: {error}</div>;

  // Posición del usuario en el ranking (si lo tienes)
  const miId = Number(localStorage.getItem("idUsuario") || "0");
  const miPosicion =
    miId
      ? ranking.findIndex((r) => r.idUsuario === miId) + 1
      : null;

  return (
   <div className="rk-wrap">
  <header className="rk-header">
    <h2>🌿 Eco-Ranking</h2>
    <div className="rk-user">
      <span>Hola, <b>{usuario?.nombreUsuario || "Invitado"}</b></span>
      <span className="rk-chip">⭐ {puntos} pts</span>
    </div>
  </header>

  <div className="rk-card">
    <table className="rk-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Usuario</th>
          <th>Puntos</th>
          <th>Recompensa</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((item, i) => (
          <tr key={item.idUsuario}>
            <td>{i + 1}</td>
            <td>{item.nombreUsuario}</td>
            <td>{item.puntosTotales}</td>
            <td>{calcularRecompensa(item.puntosTotales)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
  );


}
