import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'

export default function Layout({ children }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = usuario?.role === 'ADMIN'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/',           label: 'Dashboard'              },
    { to: '/membros',    label: 'Membros', adminOnly: true },
    { to: '/impressoes', label: 'Impressões'              },
    { to: '/catalogo',   label: 'Catálogo'                },
    { to: '/financeiro', label: 'Financeiro'              },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-bg2 border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 py-2 overflow-x-auto">
          <span className="font-mono text-accent text-sm font-medium mr-4 shrink-0">◈ Print3D</span>

          {navItems
            .filter(item => !item.adminOnly || isAdmin)
            .map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-gray-400 hover:text-white hover:bg-bg3'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

          <div className="ml-auto flex items-center gap-3 shrink-0">
            <a href="/perfil" className="text-xs text-gray-500 hover:text-white hidden sm:block transition-colors"> {usuario?.nome}</a>
            {isAdmin && (
              <span className="badge-blue text-xs hidden sm:block">admin</span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-danger transition-colors"
            >
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