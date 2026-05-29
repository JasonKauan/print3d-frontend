import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useAuthStore from '../../store/useAuthStore'
import api from '../../services/api'

export default function Layout({ children }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'
  const [fotoUrl, setFotoUrl] = useState(null)

  useEffect(() => {
    api.get('/membros/me')
      .then(r => setFotoUrl(r.data.fotoUrl))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/',            label: 'Dashboard'                  },
    { to: '/membros',     label: 'Membros',   adminOnly: true },
    { to: '/impressoras', label: 'Impressoras'                },
    { to: '/filamentos',  label: 'Filamentos'                 },
    { to: '/impressoes',  label: 'Impressões'                 },
    { to: '/producao',    label: 'Produção'                   },
    { to: '/catalogo',    label: 'Catálogo'                   },
    { to: '/financeiro',  label: 'Financeiro'                 },
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