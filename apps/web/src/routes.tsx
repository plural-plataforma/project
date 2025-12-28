import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/User/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoutes";
import SkillsList from "./pages/Skills/SkillsList";
import SkillsEdit from "./pages/Skills/EditSkill";
import PolicyPrivacy from "./pages/PolicyPrivacy";
import Register from "./pages/User/Register";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública - Login */}
        <Route path="/" element={<Login />} />

        {/* Todas as rotas PROTEGIDAS agrupadas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/skills" element={<SkillsList />} />
          <Route path="/skills/edit" element={<SkillsEdit />} />
        </Route>

        {/* Outras rotas públicas */}
        <Route path="/privacy" element={<PolicyPrivacy />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;