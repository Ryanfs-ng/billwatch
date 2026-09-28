import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RotaProtegida, RotaPublica } from "./components/RotaProtegida";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Dashboard } from "./pages/Dashboard";
import { Boletos } from "./pages/Boletos";
import { Calendario } from "./pages/Calendario";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<RotaPublica />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Route>
      </Route>
      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/boletos" element={<Boletos />} />
          <Route path="/calendario" element={<Calendario />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>,
  ),
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
