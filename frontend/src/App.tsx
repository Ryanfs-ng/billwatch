import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RotaProtegida, RotaPublica } from "./components/RotaProtegida";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Boletos } from "./pages/Boletos";
import { Calendario } from "./pages/Calendario";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RotaPublica />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<RotaProtegida />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/boletos" element={<Boletos />} />
              <Route path="/calendario" element={<Calendario />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
