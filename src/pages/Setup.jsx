import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Setup() {
  const [form, setForm]       = useState({ nome: '', email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.senha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      await api.post('/auth/setup', form)
      navigate('/login', { state: { mensagem: 'Administrador criado! Faça login.' } })
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao criar administrador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-mono text-accent">◈</span>
          <h1 className="text-2xl font-semibold mt-2">Configuração inicial</h1>
          <p className="text-gray-500 text-sm mt-1">Crie o primeiro administrador do sistema</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@print3d.com"
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                className="input"
                type="password"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            {erro && <p className="text-danger text-sm">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar administrador'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Esta página só funciona uma vez. Após criar o primeiro admin, use a tela de login.
        </p>
      </div>
    </div>
  )
}  