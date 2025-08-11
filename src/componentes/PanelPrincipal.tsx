import React, { useContext, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ContextoUsuario } from "./ContextoUsuario";

// Icono de marcador para evitar problemas de import en Leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
});

export function PanelPrincipal() {
    const { usuario, cerrarSesion } = useContext(ContextoUsuario);

    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");
    const [historial, setHistorial] = useState([]);
    const [coordsOrigen, setCoordsOrigen] = useState(null);
    const [coordsDestino, setCoordsDestino] = useState(null);

    useEffect(() => {
        const guardado = localStorage.getItem("historialRutas");
        setHistorial(guardado ? JSON.parse(guardado) : []);
    }, []);

    useEffect(() => {
        localStorage.setItem("historialRutas", JSON.stringify(historial));
    }, [historial]);

    const manejarCalculoRuta = () => {
        if (!origen || !destino) {
            alert("Por favor, ingresa un origen y un destino");
            return;
        }

        // 🚩 Simulación de coordenadas aleatorias cerca de Popayán
        const randomCoord = () => [
            2.4448  + (Math.random() - 0.5) * 0.05,
            -76.6147  + (Math.random() - 0.5) * 0.05
        ];

        const coordO = randomCoord();
        const coordD = randomCoord();

        setCoordsOrigen(coordO);
        setCoordsDestino(coordD);

        // Simulación de distancia
        const distancia = (Math.random() * 9 + 1).toFixed(1);
        const modos = ["🚶 Caminata", "🚲 Bicicleta", "🚌 Transporte público"];
        const modo = modos[Math.floor(Math.random() * modos.length)];
        const fecha = new Date().toLocaleDateString();

        const nuevaRuta = { fecha, origen, destino, distancia, modo };
        setHistorial(prev => [nuevaRuta, ...prev]);

        setOrigen("");
        setDestino("");
    };

    const totalKm = historial.reduce(
        (sum, ruta) => sum + (parseFloat(ruta.distancia) || 0),
        0
    );
    const co2Ahorrado = (totalKm * 0.3).toFixed(1);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <header style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "10px",
                backgroundColor: "#2e7d32", color: "white"
            }}>
                <h3>EcoRuta</h3>
                <div>
                    Bienvenido, <strong>{usuario?.nombreUsuario}</strong>
                    <button
                        onClick={cerrarSesion}
                        style={{ marginLeft: "15px", padding: "5px 10px", cursor: "pointer" }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, display: "flex" }}>
                <div style={{ flex: 2, padding: "10px", display: "flex", flexDirection: "column" }}>
                    <h4>Planificador de Ruta</h4>
                    <input
                        type="text"
                        placeholder="Origen"
                        value={origen}
                        onChange={(e) => setOrigen(e.target.value)}
                        style={{ marginBottom: "5px" }}
                    />
                    <input
                        type="text"
                        placeholder="Destino"
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        style={{ marginBottom: "5px" }}
                    />
                    <button onClick={manejarCalculoRuta} style={{ marginBottom: "10px" }}>
                        Calcular Ruta
                    </button>

                    {/* Mapa dinámico */}
                    <div style={{ flex: 1 }}>
                        <MapContainer
                            center={coordsOrigen || [2.4448, -76.6147]}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
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

                <div style={{ flex: 1, padding: "10px", borderLeft: "1px solid #ccc" }}>
                    <h4>Historial</h4>
                    <ul>
                        {historial.map((ruta, index) => (
                            <li key={index}>
                                {ruta.fecha} - {ruta.distancia} km - {ruta.modo}
                            </li>
                        ))}
                    </ul>
                    <h4>Estadísticas</h4>
                    <p>Total kilómetros: {totalKm.toFixed(1)} km</p>
                    <p>CO₂ ahorrado: {co2Ahorrado} kg</p>
                </div>
            </main>
        </div>
    );
}
