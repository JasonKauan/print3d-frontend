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

export default function Layout({ children }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const [fotoUrl, setFotoUrl]           = useState(null)
  const [notifs, setNotifs]             = useState([])
  const [naoLidas, setNaoLidas]         = useState(0)
  const [sininho, setSininho]           = useState(false)
  const sininhoRef                      = useRef()

  // Carrega foto do perfil
  useEffect(() => {
    api.get('/membros/me').then(r => setFotoUrl(r.data.fotoUrl)).catch(() => {})
  }, [])

  // Polling de notificações a cada 30 segundos
  useEffect(() => {
    const buscar = () => {
      api.get('/notificacoes/nao-lidas')
        .then(r => setNaoLidas(r.data.total))
        .catch(() => {})
    }
    buscar()
    const interval = setInterval(buscar, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (sininhoRef.current && !sininhoRef.current.contains(e.target)) {
        setSininho(false)
      }
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

  const navItems = [
    { to: '/',            label: 'Dashboard'                   },
    { to: '/admin',       label: 'Painel ADM', adminOnly: true },
    { to: '/membros',     label: 'Membros',    adminOnly: true },
    { to: '/impressoras', label: 'Impressoras'                 },
    { to: '/filamentos',  label: 'Filamentos'                  },
    { to: '/impressoes',  label: 'Impressões'                  },
    { to: '/producao',    label: 'Produção'                    },
    { to: '/catalogo',    label: 'Catálogo'                    },
    { to: '/financeiro',  label: 'Financeiro'                  },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-bg2 border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 py-2 overflow-x-auto">
          <span className="font-mono text-accent text-sm font-medium mr-4 shrink-0">◈ Print3D</span>

          {navItems
            .filter(item => !item.adminOnly || isAdmin)
            .map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive ? 'bg-accent text-white' : 'text-gray-400 hover:text-white hover:bg-bg3'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

          <div className="ml-auto flex items-center gap-3 shrink-0">

            {/* Sininho de notificações */}
            <div className="relative" ref={sininhoRef}>
              <button
                onClick={abrirSininho}
                className="relative p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-bg3 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {naoLidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </button>

              {/* Dropdown de notificações */}
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
                    {notifs.length === 0 ? (
                      <p className="text-center text-gray-600 text-sm py-8">Nenhuma notificação ainda</p>
                    ) : (
                      notifs.map(n => (
                        <div
                          key={n.id}
                          onClick={() => !n.lida && marcarLida(n.id)}
                          className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors cursor-pointer ${
                            n.lida ? 'opacity-50' : 'hover:bg-bg3'
                          }`}
                        >
                          <span className="text-lg shrink-0">{TIPO_ICONE[n.tipo] || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white leading-snug">{n.mensagem}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fmtTempo(n.criadoEm)}</p>
                          </div>
                          {!n.lida && (
                            <div className="w-2 h-2 bg-accent rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + nome */}
            <NavLink to="/perfil" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-bg3 border border-border overflow-hidden relative flex items-center justify-center shrink-0">
                {fotoUrl
                  ? <img src={fotoUrl} alt="avatar" className="absolute inset-0 w-full h-full object-cover" />
                  : <span className="text-xs text-gray-500 font-medium">
                      {usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                }
              </div>
              <span className="text-xs text-gray-400 hidden sm:block">{usuario?.nome}</span>
            </NavLink>

            {isAdmin && (
              <span className="badge-blue text-xs hidden sm:block">{usuario?.role?.toLowerCase()}</span>
            )}

            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-danger transition-colors">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}