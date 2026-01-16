import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoutes from './components/ProtectedRoutes'
import ChangePassword from './pages/User/ChangePassword'
import Register from './pages/User/Register'
import SkillsList from './pages/Skills/SkillsList'
import SkillsEdit from './pages/Skills/EditSkill'
import PolicyPrivacy from './pages/PolicyPrivacy'
import DataDeletionRequest from './pages/PrivacyDeletionRequest'
import AdminLayout from './components/layouts/AdminLayout'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas - sem header/sidebar */}
        <Route path="/" element={<Login />} />
        <Route path="/privacy" element={<PolicyPrivacy />} />
        <Route path="/excluded" element={<DataDeletionRequest />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas protegidas - todas com Header + Sidebar */}
        <Route element={<ProtectedRoutes />}>
          <Route element={<AdminLayout children={undefined} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/skills" element={<SkillsList />} />
            <Route path="/skills/edit" element={<SkillsEdit />} />
            <Route path="/config" element={<SkillsEdit />} />
            <Route path="/change-password" element={<ChangePassword />} />
            {/* Adicione aqui todas as outras páginas protegidas */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App