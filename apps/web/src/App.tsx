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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/privacy" element={<PolicyPrivacy />} />
        <Route path="/excluded" element={<DataDeletionRequest />} />
        <Route path="/register" element={<Register />} />

        {/* Todas as rotas PROTEGIDAS agrupadas */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skills" element={<SkillsList />} />
          <Route path="/skills/edit" element={<SkillsEdit />} />
          <Route path="/config" element={<SkillsEdit />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
