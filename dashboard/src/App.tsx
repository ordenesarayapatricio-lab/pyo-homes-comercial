import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { RequireAuth } from "./components/RequireAuth";
import { Dashboard } from "./pages/Dashboard";
import { Activities } from "./pages/Activities";
import { Captaciones } from "./pages/Captaciones";
import { Leads } from "./pages/Leads";
import { Propiedades } from "./pages/Propiedades";
import { Calendario } from "./pages/Calendario";
import { Reportes } from "./pages/Reportes";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/actividades" element={<Activities />} />
                <Route path="/captaciones" element={<Captaciones />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/propiedades" element={<Propiedades />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/configuracion" element={<Placeholder title="Configuración" />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
