import React, { useContext, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ContextoUsuario } from "./ContextoUsuario";
import L from "leaflet";
import "../PanelPrincipal.css"

// Icono de marcador para evitar problemas de import en Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
});

// Retos base
const RETOS_BASE = [
  { id: 1, descripcion: "Caminar al menos 3 km", tipo: "caminata", objetivoKm: 3, puntos: 30, completado: false },
  { id: 2, descripcion: "Hacer 2 rutas en bicicleta", tipo: "bicicleta", objetivoRutas: 2, puntos: 40, completado: false },
  { id: 3, descripcion: "Ahorrar al menos 0.5 kg de CO₂", tipo: "co2", objetivoKg: 0.5, puntos: 20, completado: false },
];

export function PanelPrincipal() {
  const { usuario, cerrarSesion } = useContext(ContextoUsuario);

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [historial, setHistorial] = useState([]);
  const [coordsOrigen, setCoordsOrigen] = useState(null);
  const [coordsDestino, setCoordsDestino] = useState(null);

  // Estado para retos y puntos
  const [retos, setRetos] = useState(() => {
    const guardado = localStorage.getItem("retosDelDia");
    const fechaGuardada = localStorage.getItem("fechaRetos");
    const hoy = new Date().toLocaleDateString();

    if (!guardado || fechaGuardada !== hoy) {
      localStorage.setItem("fechaRetos", hoy);
      localStorage.setItem("retosDelDia", JSON.stringify(RETOS_BASE));
      return RETOS_BASE;
    }
    return JSON.parse(guardado);
  });

  const [puntos, setPuntos] = useState(() => {
    return parseInt(localStorage.getItem("puntosUsuario") || "0", 10);
  });

  // Cargar historial
  useEffect(() => {
    const guardado = localStorage.getItem("historialRutas");
    setHistorial(guardado ? JSON.parse(guardado) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("historialRutas", JSON.stringify(historial));
  }, [historial]);

  // Coordenadas base para Popayán
  const POPAYAN_LAT = 2.4448;
  const POPAYAN_LNG = -76.66147;

  const randomCoordPopayan = (spread = 0.03) => [
    POPAYAN_LAT + (Math.random() - 0.5) * spread,
    POPAYAN_LNG + (Math.random() - 0.5) * spread,
  ];

  const estimarTiempo = (distanciaKm, modo) => {
    const velocidades = {
      caminata: 5,
      bicicleta: 15,
      transporte: 25,
    };
    let velocidad = velocidades.transporte;
    const key = (modo || "").toLowerCase();
    if (key.includes("camin")) velocidad = velocidades.caminata;
    else if (key.includes("bici")) velocidad = velocidades.bicicleta;
    else if (key.includes("bus") || key.includes("trans")) velocidad = velocidades.transporte;

    const distancia = parseFloat(distanciaKm) || 0;
    const tiempoHoras = velocidad > 0 ? distancia / velocidad : 0;
    let minutos = Math.round(tiempoHoras * 60);
    if (minutos < 1 && distancia > 0) minutos = 1;
    const hh = Math.floor(minutos / 60);
    const mm = minutos % 60;
    const tiempoStr = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
    return { minutos, tiempoStr };
  };

  const sumarPuntos = (p) => {
    setPuntos((prev) => {
      const nuevoTotal = prev + p;
      localStorage.setItem("puntosUsuario", nuevoTotal);
      return nuevoTotal;
    });
  };

  const actualizarRetos = (nuevaRuta, historial) => {
    const hoy = new Date().toLocaleDateString();
    let retosActualizados = [...retos];

    retosActualizados = retosActualizados.map((reto) => {
      if (reto.completado) return reto;

      if (reto.tipo === "caminata" && nuevaRuta.modo.includes("Caminata")) {
        const kmHoy = historial
          .filter((r) => r.modo.includes("Caminata") && r.fecha.includes(hoy))
          .reduce((sum, r) => sum + parseFloat(r.distancia), 0);
        if (kmHoy >= reto.objetivoKm) {
          reto.completado = true;
          sumarPuntos(reto.puntos);
          alert(`¡Reto completado! ${reto.descripcion} (+${reto.puntos} puntos)`);
        }
      }

      if (reto.tipo === "bicicleta" && nuevaRuta.modo.includes("Bicicleta")) {
        const rutasHoy = historial.filter((r) => r.modo.includes("Bicicleta") && r.fecha.includes(hoy)).length;
        if (rutasHoy >= reto.objetivoRutas) {
          reto.completado = true;
          sumarPuntos(reto.puntos);
          alert(`¡Reto completado! ${reto.descripcion} (+${reto.puntos} puntos)`);
        }
      }

      if (reto.tipo === "co2") {
        const co2Hoy = historial
          .filter((r) => r.fecha.includes(hoy))
          .reduce((sum, r) => sum + parseFloat(r.distancia) * 0.3, 0);
        if (co2Hoy >= reto.objetivoKg) {
          reto.completado = true;
          sumarPuntos(reto.puntos);
          alert(`¡Reto completado! ${reto.descripcion} (+${reto.puntos} puntos)`);
        }
      }

      return reto;
    });

    setRetos(retosActualizados);
    localStorage.setItem("retosDelDia", JSON.stringify(retosActualizados));
  };

  const manejarCalculoRuta = () => {
    if (!origen || !destino) {
      alert("Por favor, ingresa un origen y un destino");
      return;
    }

    const coordO = randomCoordPopayan(0.02);
    const coordD = randomCoordPopayan(0.02);
    setCoordsOrigen(coordO);
    setCoordsDestino(coordD);

    const distancia = (Math.random() * 11.8 + 0.2).toFixed(1);
    const modos = ["🚶 Caminata", "🚲 Bicicleta", "🚌 Transporte público"];
    const modo = modos[Math.floor(Math.random() * modos.length)];
    const fecha = new Date().toLocaleString();
    const { minutos, tiempoStr } = estimarTiempo(distancia, modo);

    const nuevaRuta = {
      fecha,
      origen,
      destino,
      distancia,
      modo,
      tiempoEstimadoMin: minutos,
      tiempoEstimadoStr: tiempoStr,
      coordsOrigen: coordO,
      coordsDestino: coordD,
    };

    setHistorial((prev) => {
      const nuevoHistorial = [nuevaRuta, ...prev];
      actualizarRetos(nuevaRuta, nuevoHistorial);
      return nuevoHistorial;
    });

    setOrigen("");
    setDestino("");
  };

  const totalKm = historial.reduce((sum, ruta) => sum + (parseFloat(ruta.distancia) || 0), 0);
  const co2Ahorrado = (totalKm * 0.3).toFixed(1);
  const totalMinutos = historial.reduce((sum, ruta) => sum + (parseInt(ruta.tiempoEstimadoMin) || 0), 0);
  const totalHoras = Math.floor(totalMinutos / 60);
  const totalMinRest = totalMinutos % 60;
  const totalTiempoStr = totalHoras > 0 ? `${totalHoras}h ${totalMinRest}m` : `${totalMinRest}m`;

  return (
  <div className="dashboard-container">
    <header className="dashboard-header">
      <h3>EcoRuta</h3>
      <div>
        Bienvenido, <strong>{usuario?.nombreUsuario}</strong> | Puntos: <strong>{puntos}</strong>
        <button className="logout-button" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </header>

    <main className="dashboard-main">
      <div className="planner-section">
        <h4>Planificador de Ruta (Popayán)</h4>
        <input
          type="text"
          placeholder="Origen"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
        />
        <input
          type="text"
          placeholder="Destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        />
        <button onClick={manejarCalculoRuta}>Calcular Ruta</button>

        <div className="map-container">
          <MapContainer
            center={coordsOrigen || [POPAYAN_LAT, POPAYAN_LNG]}
            zoom={13}
            className="map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {coordsOrigen && <Marker position={coordsOrigen}><Popup>Origen</Popup></Marker>}
            {coordsDestino && <Marker position={coordsDestino}><Popup>Destino</Popup></Marker>}
            {coordsOrigen && coordsDestino && (
              <Polyline positions={[coordsOrigen, coordsDestino]} color="blue" />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="sidebar">
        <h4>Historial</h4>
        <ul>
          {historial.map((ruta, index) => (
            <li key={index} className="historial-item">
              <strong>{ruta.fecha}</strong><br />
              {ruta.origen} → {ruta.destino} — {ruta.distancia} km — {ruta.modo} — <em>{ruta.tiempoEstimadoStr}</em>
            </li>
          ))}
        </ul>

        <h4>Estadísticas</h4>
        <p>Total kilómetros: {totalKm.toFixed(1)} km</p>
        <p>CO₂ ahorrado: {co2Ahorrado} kg</p>
        <p>Tiempo total estimado: {totalTiempoStr}</p>

        <h4>Retos del día</h4>
        <ul>
          {retos.map((reto) => (
            <li key={reto.id}>
              {reto.descripcion} — {reto.completado ? "✅" : "❌"}
            </li>
          ))}
        </ul>
      </div>
    </main>
  </div>
);

}
