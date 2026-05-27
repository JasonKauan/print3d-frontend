import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Setup from './pages/Setup'
import EsqueceuSenha from './pages/EsqueceuSenha'
import ResetarSenha from './pages/ResetarSenha'
import Dashboard from './pages/Dashboard'
import Membros from './pages/Membros'
import Impressoes from './pages/Impressoes'
import Impressoras from './pages/Impressoras'
import Filamentos from './pages/Filamentos'
import Catalogo from './pages/Catalogo'
import Financeiro from './pages/Financeiro'
import Perfil from './pages/Perfil'

function RotaProtegida({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function RotaAdmin({ children }) {
  const { token, usuario } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (usuario?.role !== 'ADMIN' && usuario?.role !== 'DEV') return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"          element={<Login />} />
      <Route path="/setup"          element={<Setup />} />
      <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
      <Route path="/resetar-senha"  element={<ResetarSenha />} />

      <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path="/impressoes"  element={<RotaProtegida><Impressoes /></RotaProtegida>} />
      <Route path="/impressoras" element={<RotaProtegida><Impressoras /></RotaProtegida>} />
      <Route path="/filamentos"  element={<RotaProtegida><Filamentos /></RotaProtegida>} />
      <Route path="/catalogo"    element={<RotaProtegida><Catalogo /></RotaProtegida>} />
      <Route path="/financeiro"  element={<RotaProtegida><Financeiro /></RotaProtegida>} />
      <Route path="/perfil"      element={<RotaProtegida><Perfil /></RotaProtegida>} />

      <Route path="/membros" element={<RotaAdmin><Membros /></RotaAdmin>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}