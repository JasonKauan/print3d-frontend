import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useAuthStore from '../../store/useAuthStore'
import api from '../../services/api'

const TIPO_ICONE = {
  NOVA_VENDA:          '🛍️',
  IMPRESSORA_LIBERADA: '🖨️',
  FILAMENTO_BAIXO:     '⚠️',
  REPASSE_PAGO:        '💰',
  REPASSE_PENDENTE:    '⏳',
}

function fmtTempo(data) {
  const diff = Math.floor((Date.now() - new Date(data)) / 1000)
  if (diff < 60)    return 'agora'
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// Ícones SVG para cada item do menu
const ICONS = {
  dashboard:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  admin:       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  membros:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  impressoras: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
  filamentos:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />,
  impressoes:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  producao:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  catalogo:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  financeiro:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  estoque:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  relatorios:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
}

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-accent text-white'
            : 'text-gray-400 hover:text-white hover:bg-bg3'
        }`
      }
    >
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const [fotoUrl, setFotoUrl]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifs, setNotifs]     = useState([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [sininho, setSininho]   = useState(false)
  const sininhoRef              = useRef()

  useEffect(() => {
    api.get('/membros/me').then(r => setFotoUrl(r.data.fotoUrl)).catch(() => {})
  }, [])

  useEffect(() => {
    const buscar = () => {
      api.get('/notificacoes/nao-lidas').then(r => setNaoLidas(r.data.total)).catch(() => {})
    }
    buscar()
    const interval = setInterval(buscar, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (sininhoRef.current && !sininhoRef.current.contains(e.target)) setSininho(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const abrirSininho = async () => {
    if (!sininho) {
      const { data } = await api.get('/notificacoes')
      setNotifs(data)
    }
    setSininho(s => !s)
  }

  const marcarLida = async (id) => {
    await api.patch(`/notificacoes/${id}/lida`)
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, lida: true } : n))
    setNaoLidas(c => Math.max(0, c - 1))
  }

  const marcarTodas = async () => {
    await api.patch('/notificacoes/todas-lidas')
    setNotifs(ns => ns.map(n => ({ ...n, lida: true })))
    setNaoLidas(0)
  }

  const handleLogout = () => { logout(); navigate('/login') }
  const closeSidebar = () => setSidebarOpen(false)

  const navItems = [
    { to: '/',            label: 'Dashboard',   icon: ICONS.dashboard              },
    { to: '/admin',       label: 'Painel ADM',  icon: ICONS.admin,  adminOnly: true },
    { to: '/membros',     label: 'Membros',     icon: ICONS.membros, adminOnly: true },
    { to: '/impressoras', label: 'Impressoras', icon: ICONS.impressoras             },
    { to: '/filamentos',  label: 'Filamentos',  icon: ICONS.filamentos              },
    { to: '/impressoes',  label: 'Impressões',  icon: ICONS.impressoes              },
    { to: '/producao',    label: 'Produção',    icon: ICONS.producao                },
    { to: '/catalogo',    label: 'Catálogo',    icon: ICONS.catalogo                },
    { to: '/financeiro',  label: 'Financeiro',  icon: ICONS.financeiro              },
    { to: '/estoque',     label: 'Estoque',     icon: ICONS.estoque                 },
    { to: '/relatorios',  label: 'Relatórios',  icon: ICONS.relatorios              },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <span className="font-mono text-accent text-lg font-bold">◈ Print3D</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(({ to, label, icon }) => (
            <NavItem key={to} to={to} icon={icon} label={label} onClick={closeSidebar} />
          ))}
      </nav>

      {/* Footer da sidebar — perfil + sair */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <NavLink to="/perfil" onClick={closeSidebar}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-bg3 transition-all">
          <div className="w-7 h-7 rounded-full bg-bg3 border border-border relative overflow-hidden flex items-center justify-center shrink-0">
            {fotoUrl
              ? <img src={fotoUrl} alt="avatar" className="absolute inset-0 w-full h-full object-cover" />
              : <span className="text-xs text-gray-500 font-medium">
                  {usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
                </span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{usuario?.nome}</p>
            <p className="text-xs text-gray-500 truncate">{usuario?.role?.toLowerCase()}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-danger hover:bg-bg3 transition-all">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* Sidebar desktop — sempre visível */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-bg2 border-r border-border">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile — overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60" onClick={closeSidebar} />
          {/* Drawer */}
          <aside className="relative flex flex-col w-56 bg-bg2 border-r border-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-4 py-3 bg-bg2 border-b border-border shrink-0">
          {/* Hambúrguer mobile */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-bg3 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="lg:hidden font-mono text-accent text-sm font-bold">◈ Print3D</div>

          {/* Notificações */}
          <div className="relative ml-auto" ref={sininhoRef}>
            <button onClick={abrirSininho}
              className="relative p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-bg3 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {naoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {sininho && (
              <div className="absolute right-0 top-9 w-80 bg-bg2 border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium">Notificações</span>
                  {naoLidas > 0 && (
                    <button onClick={marcarTodas} className="text-xs text-accent hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0
                    ? <p className="text-center text-gray-600 text-sm py-8">Nenhuma notificação ainda</p>
                    : notifs.map(n => (
                        <div key={n.id} onClick={() => !n.lida && marcarLida(n.id)}
                          className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors cursor-pointer ${
                            n.lida ? 'opacity-50' : 'hover:bg-bg3'
                          }`}>
                          <span className="text-lg shrink-0">{TIPO_ICONE[n.tipo] || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white leading-snug">{n.mensagem}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fmtTempo(n.criadoEm)}</p>
                          </div>
                          {!n.lida && <div className="w-2 h-2 bg-accent rounded-full shrink-0 mt-1.5" />}
                        </div>
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}