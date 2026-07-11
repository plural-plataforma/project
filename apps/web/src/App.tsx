// src/App.tsx
import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

// Componentes de layout e proteção (não são "páginas" — carregados sempre)
import ProtectedRoutes from './components/ProtectedRoutes'
import AdminLayout from './components/layouts/AdminLayout'
import RequireAdmin from './components/RequireAdmin'

// Páginas — code-splitting via React.lazy para reduzir o bundle inicial.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/User/Register'))
const PolicyPrivacy = lazy(() => import('./pages/PolicyPrivacy'))
const DataDeletionRequest = lazy(() => import('./pages/PrivacyDeletionRequest'))
const AcessoRestrito = lazy(() => import('./pages/AcessoRestrito'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const SkillsList = lazy(() => import('./pages/Skills/SkillsList'))
const SkillsEdit = lazy(() => import('./pages/Skills/EditSkill'))
const SkillsNew = lazy(() => import('./pages/Skills/SkillsNew'))
const ChangePassword = lazy(() => import('./pages/User/ChangePassword'))
const UsuariosPage = lazy(() => import('./pages/UserApp/UsuariosPage'))
const DashboardBlocos = lazy(() => import('./pages/Blocos/DashboardBlocos'))
const CadastroBloco = lazy(() => import('./pages/Blocos/CadastrosBloco'))
const DashboardAtividades = lazy(() => import('./pages/Atividades/DashboardAtividades'))
const CadastroDeAtividade = lazy(() => import('./pages/Atividades/CadastroDeAtividade'))
const ConfiguracoesGerais = lazy(() => import('./pages/Configuracoes/ConfiguracoesGerais'))

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Rotas públicas - sem header/sidebar */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} /> {/* opcional: alias */}
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<PolicyPrivacy />} />
          <Route path="/excluded" element={<DataDeletionRequest />} />
          <Route path="/acesso-restrito" element={<AcessoRestrito />} />
          {/* Todas as rotas protegidas com layout admin + autenticação */}
          <Route element={<ProtectedRoutes />}>
            <Route element={<AdminLayout />}>
              <Route element={<RequireAdmin />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/skills" element={<SkillsList />} />
                <Route path="/skills/edit/:id" element={<SkillsEdit />} />
                <Route path="/skills/new" element={<SkillsNew />} />

                {/* Exemplos de rotas que você provavelmente terá */}
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route
                  path="/blocos"
                  element={<DashboardBlocos />}
                />
                <Route path="/blocos/novo" element={<CadastroBloco />} />           {/* create */}
                <Route path="/blocos/:id/:action?" element={<CadastroBloco />} />    {/* edit */}
                <Route path="/blocos/:id" element={<CadastroBloco />} />           {/* view */}
                <Route path="/blocos/novo" element={<CadastroBloco />} />
                <Route path="/atividades" element={<DashboardAtividades />} />
                <Route path="/atividades/novo" element={<CadastroDeAtividade />} />
                <Route path="/atividades/:id/:action?" element={<CadastroDeAtividade />} />

                <Route path="/configuracoes" element={<ConfiguracoesGerais />} />

                {/* Rotas do usuário */}
                <Route path="/change-password" element={<ChangePassword />} />
              </Route>
            </Route>
          </Route>
          {/* Rota 404 - opcional */}
          <Route path="*" element={<div>404 - Página não encontrada</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
