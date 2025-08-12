import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProveedorUsuario, ContextoUsuario } from "./componentes/ContextoUsuario";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Registro } from "./componentes/Registro";
import { InicioSesion } from "./componentes/InicioSesion";
import { PanelPrincipal } from "./componentes/PanelPrincipal";
import LoginSuccess from "./componentes/LoginSuccess";
import Ranking from "./componentes/Ranking";

function RutasProtegidas({ children }) {
    const { usuario } = useContext(ContextoUsuario);
    return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <GoogleOAuthProvider clientId="TU_CLIENT_ID_DE_GOOGLE">
            <ProveedorUsuario>
                <Router>
                    <Routes>
                        <Route path="/register" element={<Registro />} />
                        <Route path="/login" element={<InicioSesion />} />
                        <Route path="/login/success" element={<LoginSuccess />} />

                        {/* Ruta protegida */}
                        <Route
                            path="/home"
                            element={
                                <RutasProtegidas>
                                    <PanelPrincipal />
                                </RutasProtegidas>
                            }
                        />
                        <Route
                            path="/ranking"
                            element={
                                <RutasProtegidas>
                                    <Ranking />
                                </RutasProtegidas>
                            }
                        />
                        {/* Redirección por defecto */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </ProveedorUsuario>

        </GoogleOAuthProvider>
    );
}
