import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ContextoUsuario } from "./ContextoUsuario";
import L from "leaflet";
import "../PanelPrincipal.css";


// Icon fix Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
});

type JwtPayloadCustom = {
  idUsuario?: number; // según cómo esté tu token
  sub?: string;
  // agrega aquí más campos si tu JWT los tiene
};

// Retos base
const RETOS_BASE = [
  { id: 1, descripcion: "Caminar al menos 3 km", tipo: "caminata", objetivoKm: 3, puntos: 30, completado: false },
  { id: 2, descripcion: "Hacer 2 rutas en bicicleta", tipo: "bicicleta", objetivoRutas: 2, puntos: 40, completado: false },
  { id: 3, descripcion: "Ahorrar al menos 0.5 kg de CO₂", tipo: "co2", objetivoKg: 0.5, puntos: 20, completado: false },
];

// Helpers
const secondsToMin = (s) => Math.round((s || 0) / 60);
const metersToKm = (m) => ((m || 0) / 1000);

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Click handler
function ClickHandler({
  coordsOrigen,
  coordsDestino,
  setCoordsOrigen,
  setCoordsDestino,
  setRouteCoords,
  setDistKm,
  setTimeMin,
  modoPerfil,
  setLoadingRoute,
}) {
  const map = useMapEvents({
    click(e) {
      const latlng = [e.latlng.lat, e.latlng.lng];

      if (!coordsOrigen) {
        setCoordsOrigen(latlng);
      } else if (!coordsDestino) {
        setCoordsDestino(latlng);
        setLoadingRoute(true);

        const url = `https://router.project-osrm.org/route/v1/${modoPerfil}/${coordsOrigen[1]},${coordsOrigen[0]};${latlng[1]},${latlng[0]}?overview=full&geometries=geojson`;

        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (data?.routes?.length > 0) {
              const route = data.routes[0];
              const distKm = metersToKm(route.distance);
              const timeMin = secondsToMin(route.duration);

              const coordsGeo = (route.geometry?.coordinates || []).map((c) => [c[1], c[0]]);
              setRouteCoords(coordsGeo.length ? coordsGeo : [coordsOrigen, latlng]);
              setDistKm(distKm);
              setTimeMin(timeMin);

              try {
                const bounds = L.latLngBounds([coordsOrigen, latlng]);
                map.fitBounds(bounds, { padding: [50, 50] });
              } catch { }
            } else {
              const hk = haversineKm(coordsOrigen, latlng);
              setRouteCoords([coordsOrigen, latlng]);
              setDistKm(hk);
              setTimeMin(Math.round((hk / 5) * 60));
            }
          })
          .catch(() => {
            const hk = haversineKm(coordsOrigen, latlng);
            setRouteCoords([coordsOrigen, latlng]);
            setDistKm(hk);
            setTimeMin(Math.round((hk / 5) * 60));
          })
          .finally(() => {
            setLoadingRoute(false);
          });
      } else {
        setCoordsOrigen(latlng);
        setCoordsDestino(null);
        setRouteCoords(null);
        setDistKm(null);
        setTimeMin(null);
      }
    },
  });

  return null;
}

export function PanelPrincipal() {
  const { usuario, cerrarSesion } = useContext(ContextoUsuario);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [historial, setHistorial] = useState([]);
  const [coordsOrigen, setCoordsOrigen] = useState(null);
  const [coordsDestino, setCoordsDestino] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const [distKm, setDistKm] = useState(null);
  const [timeMin, setTimeMin] = useState(null);
  const [modo, setModo] = useState("🚶 Caminata");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const navigate = useNavigate();


  const modoToProfile = (m) =>
    m.toLowerCase().includes("bici")
      ? "cycling"
      : m.toLowerCase().includes("camin")
        ? "walking"
        : "driving";

  // Gamificación - puntos y retos
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

  // Cargar historial y ruta actual de localStorage
useEffect(() => {
  const guardadoHistorial = localStorage.getItem("historialRutas");
  if (guardadoHistorial) {
    setHistorial(JSON.parse(guardadoHistorial));
  }

  const guardadaRuta = localStorage.getItem("rutaActual");
  if (guardadaRuta) {
    const { coordsOrigen, coordsDestino, routeCoords, distKm, timeMin } = JSON.parse(guardadaRuta);
    setCoordsOrigen(coordsOrigen);
    setCoordsDestino(coordsDestino);
    setRouteCoords(routeCoords);
    setDistKm(distKm);
    setTimeMin(timeMin);
  }
}, []);


  // Guardar ruta actual en localStorage
useEffect(() => {
  localStorage.setItem(
    "rutaActual",
    JSON.stringify({ coordsOrigen, coordsDestino, routeCoords, distKm, timeMin })
  );
}, [coordsOrigen, coordsDestino, routeCoords, distKm, timeMin]);


  // Guardar ruta automáticamente
  useEffect(() => {
    if (coordsOrigen && coordsDestino && distKm != null && timeMin != null && !loadingRoute) {
      const fecha = new Date().toLocaleString();
      const nuevaRuta = {
        fecha,
        origen: origen || `Mapa (${coordsOrigen[0].toFixed(4)},${coordsOrigen[1].toFixed(4)})`,
        destino: destino || `Mapa (${coordsDestino[0].toFixed(4)},${coordsDestino[1].toFixed(4)})`,
        distancia: distKm.toFixed(2),
        modo: modo,
        tiempoEstimadoMin: timeMin,
        tiempoEstimadoStr: timeMin >= 60 ? `${Math.floor(timeMin / 60)}h ${timeMin % 60}m` : `${timeMin}m`,
        coordsOrigen,
        coordsDestino,
        routeCoords,
      };

      setHistorial((prev) => {
        const nuevoHistorial = [nuevaRuta, ...prev];
        actualizarRetos(nuevaRuta, nuevoHistorial);
        return nuevoHistorial;
      });

      setOrigen("");
      setDestino("");
    }
  }, [distKm, timeMin, coordsOrigen, coordsDestino, loadingRoute]);

  const resetSelection = () => {
    setCoordsOrigen(null);
    setCoordsDestino(null);
    setRouteCoords(null);
    setDistKm(null);
    setTimeMin(null);
  };

  const POPAYAN_LAT = 2.4448;
  const POPAYAN_LNG = -76.66147;

  const getIdUsuario = () => {
    const raw = localStorage.getItem("idUsuario");
    return raw;
  };

  async function guardarCambios(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    event.preventDefault();

    try {
      // 1) Leer valores crudos del localStorage
      const token = localStorage.getItem("token") ?? "";
      const idUsuarioRaw = localStorage.getItem("idUsuario");
      const puntosRaw = localStorage.getItem("puntosUsuario") ?? "0";

      console.log("[DEBUG] token?", !!token, "idUsuarioRaw:", idUsuarioRaw, "puntosRaw:", puntosRaw);

      // 2) Validar presencia de idUsuario
      if (idUsuarioRaw === null) {
        throw new Error("Falta 'idUsuario' en localStorage");
      }
      const idUsuario = Number(idUsuarioRaw);
      if (!Number.isFinite(idUsuario)) {
        throw new Error(`'idUsuario' inválido en localStorage: ${idUsuarioRaw}`);
      }

      // 3) Convertir puntos
      const puntos = Number(puntosRaw);
      if (!Number.isFinite(puntos)) {
        throw new Error(`'puntosUsuario' inválido en localStorage: ${puntosRaw}`);
      }

      // 4) Preparar headers (si tu endpoint NO está protegido, puedes omitir Authorization)
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 5) Hacer el POST
      const resp = await fetch(`http://localhost:6090/user/registerPuntos/${idUsuario}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ puntos }), // tu DTO PuntosRequest { Double puntos; }
      });

      if (resp.status === 401 || resp.status === 403) {
        throw new Error("No autorizado (401/403). Repite login o revisa el Bearer.");
      }
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(t || `Error HTTP ${resp.status}`);
      }

      // tu backend devuelve String → usa text()
      const data = await resp.text();
      console.log("Cambios guardados:", data);
      alert("Cambios guardados correctamente");
      
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }

  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h3>EcoRuta</h3>
        <div>
          Bienvenido, <strong>{usuario?.nombreUsuario}</strong> | ⭐ {puntos} pts
          <button className="logout-button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="planner-section">
          <div className="card">
            <h4>Planificador de Ruta (Popayán)</h4>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="Origen (opcional)"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                placeholder="Destino (opcional)"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <select value={modo} onChange={(e) => setModo(e.target.value)}>
                <option>🚶 Caminata</option>
                <option>🚲 Bicicleta</option>
                <option>🚌 Transporte público</option>
              </select>
              <button onClick={resetSelection} className="btn btn-sm">Reset</button>
              <div style={{ marginLeft: "auto", fontSize: 14 }}>
                {loadingRoute ? <em>Calculando ruta...</em> : (distKm ? <>📏 {distKm.toFixed(2)} km — ⏱ {timeMin} min</> : <em>Selecciona origen y destino en el mapa</em>)}
              </div>
            </div>
          </div>

          <div className="card map-container" style={{ position: "relative" }}>
            {loadingRoute && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 500,
                display: "flex", justifyContent: "center", alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.6)"
              }}>
                <div>Calculando ruta…</div>
              </div>
            )}

            <MapContainer center={[POPAYAN_LAT, POPAYAN_LNG]} zoom={13} className="map">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

              <ClickHandler
                coordsOrigen={coordsOrigen}
                coordsDestino={coordsDestino}
                setCoordsOrigen={setCoordsOrigen}
                setCoordsDestino={setCoordsDestino}
                setRouteCoords={setRouteCoords}
                setDistKm={setDistKm}
                setTimeMin={setTimeMin}
                modoPerfil={modoToProfile(modo)}
                setLoadingRoute={setLoadingRoute}
              />

              {coordsOrigen && <Marker position={coordsOrigen}><Popup>Origen</Popup></Marker>}
              {coordsDestino && <Marker position={coordsDestino}><Popup>Destino</Popup></Marker>}
              {routeCoords && <Polyline positions={routeCoords} color={modoToProfile(modo) === "walking" ? "green" : modoToProfile(modo) === "cycling" ? "orange" : "blue"} />}
              {!routeCoords && coordsOrigen && coordsDestino && <Polyline positions={[coordsOrigen, coordsDestino]} color="blue" />}
            </MapContainer>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-card">
            <h4>Historial</h4>
            <ul>
              {historial.map((ruta, idx) => (
                <li key={idx} className="historial-item">
                  <strong>{ruta.fecha}</strong><br />
                  {ruta.origen} → {ruta.destino} — {ruta.distancia} km — {ruta.modo} — <em>{ruta.tiempoEstimadoStr}</em>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-card">
            <h4>Puntos: {puntos}</h4>
            <h4>Retos del día</h4>
            <ul>
              {retos.map((reto) => (
                <li key={reto.id}>
                  {reto.descripcion} — {reto.completado ? "✅" : "❌"}
                </li>
              ))}
            </ul>

            <button onClick={guardarCambios}>Guardar</button>
            <button onClick={() => navigate("/ranking")}>Ver ranking</button>
            <h2>ranking de {usuario?.nombreUsuario || "Usuario invitado"}</h2>
          </div>
        </aside>
      </main>
    </div>
  );
}
