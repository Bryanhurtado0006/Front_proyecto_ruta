// src/componentes/Ranking.jsx
import React, { useState, useEffect, useContext } from "react";
import { ContextoUsuario } from "./ContextoUsuario";
import "../Ranking.css";

export default function Ranking() {
  const { usuario } = useContext(ContextoUsuario);
  const [puntos, setPuntos] = useState(0);
  const [recompensa, setRecompensa] = useState("");

  // Sistema de recompensas reales
  const calcularRecompensa = (pts) => {
    if (pts < 100) return "🔒 Aún sin recompensa. ¡Sigue acumulando!";
    if (pts >= 100 && pts < 150) return "🎁 5% de descuento en Éxito";
    if (pts >= 150 && pts < 200) return "🎁 10% de descuento en Jumbo";
    if (pts >= 200 && pts < 300) return "🎁 Bono de $20,000 en Alkosto";
    if (pts >= 300) return "🎉 Bono de $50,000 en Éxito o Jumbo";
  };

  useEffect(() => {
    const ptsGuardados = parseInt(localStorage.getItem("puntosUsuario") || "0", 10);
    setPuntos(ptsGuardados);
    setRecompensa(calcularRecompensa(ptsGuardados));
  }, []);

  return (
  <div className="contenedor">
    <header className="ranking-header">
      <div className="ranking-header-left">
        <h3>🌿 Eco-Ranking</h3>
      </div>
      <div className="ranking-header-right">
        <span className="welcome-text">
          Bienvenido, <strong>{usuario?.nombreUsuario || "Invitado"}</strong>
        </span>
        <span className="ranking-points">⭐ {puntos} pts</span>
      </div>
    </header>

    <main>
      <div className="ranking-container">
        <div className="ranking-user-info">
          <div className="user-badge">
            🏅
            <span>{usuario?.nombreUsuario || "Usuario invitado"}</span>
          </div>
          <p className="user-subtitle">Tu posición en el ranking de EcoRuta</p>
        </div>

        <table className="ranking-table">
          <thead>
            <tr>
              <th>Puntos</th>
              <th>Recompensa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{puntos}</td>
              <td>{recompensa}</td>
            </tr>
          </tbody>
        </table>

        {puntos >= 100 && (
          <p className="ranking-note">
            🎉 Felicidades, ya puedes reclamar tu recompensa. Contacta con soporte para recibir tu código.
          </p>
        )}
      </div>
    </main>
  </div>
);


}
