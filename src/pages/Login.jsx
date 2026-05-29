import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { useNomeEntidade } from '../hooks/useNomeEntidade'

export default function Login() {
  const [form, setForm]       = useState({ email: '', senha: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuthStore()
  const navigate              = useNavigate()
  const location              = useLocation()
  const nomeEntidade          = useNomeEntidade()

  // Mensagem de sucesso vinda do /setup ou /resetar-senha
  const mensagemSucesso = location.state?.mensagem

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.senha)
      navigate('/')
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data || ''
      if (typeof msg === 'string' && msg.toLowerCase().includes('inativ')) {
        setError('Sua conta está inativa. Entre em contato com o administrador.')
      } else {
        setError('Email ou senha incorretos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-mono text-accent">◈</span>
          <h1 className="text-2xl font-semibold mt-2">{nomeEntidade}</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de gestão</p>
        </div>

        {mensagemSucesso && (
          <div className="mb-4 px-4 py-3 bg-green-900/30 border border-success rounded-xl text-success text-sm text-center">
            {mensagemSucesso}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.senha}
                onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))}
                required
              />
            </div>

            {error && <p className="text-danger text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="text-center">
              <Link
                to="/esqueceu-senha"
                className="text-xs text-gray-500 hover:text-accent transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Primeiro acesso?{' '}
          <Link to="/setup" className="text-accent hover:underline">
            Configurar sistema
          </Link>
        </p>
      </div>
    </div>
  )
}