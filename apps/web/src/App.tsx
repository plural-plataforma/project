// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Páginas públicas
import Login from './pages/Login'
import Register from './pages/User/Register'
import PolicyPrivacy from './pages/PolicyPrivacy'
import DataDeletionRequest from './pages/PrivacyDeletionRequest'

// Páginas protegidas
import Dashboard from './pages/Dashboard'
import SkillsList from './pages/Skills/SkillsList'
import SkillsEdit from './pages/Skills/EditSkill'
import ChangePassword from './pages/User/ChangePassword'

// Componentes de layout e proteção
import ProtectedRoutes from './components/ProtectedRoutes'
import AdminLayout from './components/layouts/AdminLayout'
import UsuariosPage from './pages/UserApp/UsuariosPage'
import DashboardBlocos from './pages/Blocos/DashboardBlocos'
import CadastroBloco from './pages/Blocos/CadastrosBloco'
import DashboardAtividades from './pages/Atividades/DashboardAtividades'
import CadastroDeAtividade from './pages/Atividades/CadastroDeAtividade'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas - sem header/sidebar */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> {/* opcional: alias */}
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<PolicyPrivacy />} />
        <Route path="/excluded" element={<DataDeletionRequest />} />
        {/* Todas as rotas protegidas com layout admin + autenticação */}
        <Route element={<ProtectedRoutes />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/skills" element={<SkillsList />} />
            <Route path="/skills/edit" element={<SkillsEdit />} />

            {/* Exemplos de rotas que você provavelmente terá */}
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route
              path="/blocos"
              element={<DashboardBlocos />}
            />
            <Route path="/blocos/novo" element={<CadastroBloco />} />           {/* create */}
            <Route path="/blocos/:id/:action?" element={<CadastroBloco />} />    {/* edit */}
            <Route path="/blocos/:id" element={<CadastroBloco />} />           {/* view */}
            <Route path="/blocos/novo" element={<CadastroBloco />}/>
            <Route path="/atividades" element={<DashboardAtividades />}/>
            <Route path="/atividades/novo" element={<CadastroDeAtividade />}/>
            <Route path="/atividades/:id/:action?" element={<CadastroDeAtividade />}/>

            <Route
              path="/configuracoes"
              element={<div>Configurações Gerais (em breve)</div>}
            />

            {/* Rotas do usuário */}
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>
        </Route>
        {/* Rota 404 - opcional */}
        <Route path="*" element={<div>404 - Página não encontrada</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
