import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// Importação das Views
import Welcome from "./views/Shared/Welcome";
import Register from "./views/Shared/Register";
import Login from "./views/Shared/Login";
import Home from "./views/Shared/Home";
import RecoverPassword from "./views/Shared/RecoverPassword";
import Booking from "./views/Client/Booking";
import ClientSettings from "./views/Client/ClientSettings";
import BarberDashboard from "./views/Barber/BarberDashboard"; 
import BarberChief from "./views/BarberChief/BarberChief";
import DashboardBarbeiro from "./views/BarberChief/DashboarChief";
import BarberCreate from "./views/BarberChief/BarberCreate";
import Appointments from "./views/Client/Appointments";
import BarberWaitlistPage from "./views/Barber/BarberWaitlistPage";

// Utilitário para buscar usuário e limpar cache
function getStoredUser() {
  const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!stored) return null;

  try {
    const user = JSON.parse(stored);
    const validRoles = ["admin", "barber", "client"];
    const userRole = user?.role ? String(user.role).toLowerCase() : "";

    if (!validRoles.includes(userRole)) {
      console.warn("⚠️ Utilizador sem cargo válido. A limpar credenciais...");
      localStorage.clear();
      sessionStorage.clear();
      return null; 
    }

    user.role = userRole; 
    return user;
  } catch (error) {
    return null;
  }
}

// 🧭 Define a página principal correta com base no cargo do utilizador
function getDefaultRoute(role) {
  if (!role) return "/login";

  const r = String(role).toLowerCase();
  if (r === "admin") return "/dashboard-chief";
  if (r === "barber") return "/barber-dashboard";
  if (r === "client") return "/home";

  return "/login"; 
}

// 🛡️ Guardião de Rotas (Modo Silencioso)
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Se o utilizador não tiver permissão para a página, 
  // recambia-o suavemente para o painel principal dele (sem ecrãs vermelhos!)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return children;
}

// 🗺️ Configuração das Rotas
function AppRoutes() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const handleClientNavigate = (page) => {
    const routes = {
      dashboard: "/home",
      home: "/home",
      calendar: "/appointments",
      profile: "/profile",
    };
    if (routes[page]) navigate(routes[page]);
  };

  const handleBarberNavigate = (page) => {
    // Regra de exceção para criação
    if (page === "create" && user?.role === "admin") {
      return navigate("/barber-create");
    }

    // Define a base correta dependendo se é admin ou barbeiro normal
    const basePath = user?.role === "admin" ? "/dashboard-chief" : "/barber-dashboard";

    const routes = {
      dashboard: "/dashboard-barbeiro",
      home: basePath,
      search: `${basePath}?tab=search`,
      calendar: "/barber-chief?section=agenda",
      profile: "/barber-chief?section=menu",
      waitlist: "/barber-waitlist",
    };

    if (routes[page]) navigate(routes[page]);
  };

  return (
    <Routes>
      {/* --- ROTAS PÚBLICAS --- */}
      <Route
        path="/"
        element={
          token && user ? (
            <Navigate to={getDefaultRoute(user?.role)} replace />
          ) : (
            <Welcome
              onCreateAccount={() => navigate("/register")}
              onLogin={() => navigate("/login")}
            />
          )
        }
      />

      <Route
        path="/login"
        element={
          <Login
            // Agora o Login delega a decisão da rota para o getDefaultRoute
            onLoginSuccess={(userData) => navigate(getDefaultRoute(userData?.role))}
            onGoToRegister={() => navigate("/register")}
            onGoToRecover={() => navigate("/recover")}
          />
        }
      />
      <Route path="/register" element={<Register onBack={() => navigate("/")} />} />
      <Route path="/recover" element={<RecoverPassword onBackToLogin={() => navigate("/login")} />} />

      {/* --- ROTAS PRIVADAS (CLIENTES) --- */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <Home
              onLogout={handleLogout}
              onStartBooking={() => navigate("/booking")}
              onNavigate={handleClientNavigate}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <Booking onBack={() => navigate("/home")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <Appointments onNavigate={handleClientNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientSettings onNavigate={handleClientNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* --- ROTAS PRIVADAS (BARBEIROS E ADMIN) --- */}
      <Route
        path="/dashboard-chief"
        element={
          <ProtectedRoute allowedRoles={["barber", "admin"]}>
            <BarberDashboard onNavigate={handleBarberNavigate} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard-barbeiro"
        element={
          <ProtectedRoute allowedRoles={["barber", "admin"]}>
            <DashboardBarbeiro />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/barber-dashboard"
        element={
          <ProtectedRoute allowedRoles={["barber", "admin"]}>
            <BarberDashboard onNavigate={handleBarberNavigate} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/barber-chief"
        element={
          <ProtectedRoute allowedRoles={["barber", "admin"]}>
            <BarberChief
              onOpenCreate={() => navigate("/barber-create")}
              onOpenDashboard={() => navigate("/dashboard-barbeiro")}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber-waitlist"
        element={
          <ProtectedRoute allowedRoles={["barber", "admin"]}>
            <BarberWaitlistPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber-create"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <BarberCreate onBack={() => navigate(getDefaultRoute(user?.role))} />
          </ProtectedRoute>
        }
      />

      {/* Rota Fallback (Redirecionamento Invisível para quem se perder) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Ponto de Entrada da Aplicação
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;