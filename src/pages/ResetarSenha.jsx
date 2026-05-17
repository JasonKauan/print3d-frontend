import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function ResetarSenha() {
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()
  const token                   = searchParams.get('token')

  const [form, setForm]         = useState({ novaSenha: '', confirmar: '' })
  const [loading, setLoading]   = useState(false)
  const [validando, setValidando] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [sucesso, setSucesso]   = useState(false)
  const [erro, setErro]         = useState('')

  // Valida o token assim que a tela carrega
  useEffect(() => {
    if (!token) {
      setErro('Link inválido. Solicite um novo.')
      setValidando(false)
      return
    }

    api.get(`/auth/validar-token?token=${token}`)
      .then(() => setTokenValido(true))
      .catch(e => setErro(e.response?.data?.erro || 'Link inválido ou expirado.'))
      .finally(() => setValidando(false))
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    if (form.novaSenha !== form.confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (form.novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/resetar-senha', { token, novaSenha: form.novaSenha })
      setSucesso(true)
      // Redireciona para o login após 3 segundos
      setTimeout(() => navigate('/login', {
        state: { mensagem: 'Senha redefinida com sucesso! Faça login.' }
      }), 3000)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  if (validando) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-mono text-accent">◈</span>
          <h1 className="text-2xl font-semibold mt-2">Print3D</h1>
          <p className="text-gray-500 text-sm mt-1">Redefinir senha</p>
        </div>

        {sucesso ? (
          <div className="card text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="font-semibold mb-2">Senha redefinida!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
            <Link to="/login" className="btn-primary w-full block text-center py-2">
              Ir para o login
            </Link>
          </div>
        ) : !tokenValido ? (
          <div className="card text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-semibold mb-2">Link inválido</h3>
            <p className="text-danger text-sm mb-4">{erro}</p>
            <Link to="/esqueceu-senha" className="btn-primary w-full block text-center py-2">
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <div className="card">
            <p className="text-gray-400 text-sm mb-4">
              Digite sua nova senha. Ela deve ter no mínimo 6 caracteres.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nova senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={form.novaSenha}
                  onChange={e => setForm(f => ({ ...f, novaSenha: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Confirmar nova senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repita a nova senha"
                  value={form.confirmar}
                  onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
                  required
                />
              </div>
              {erro && <p className="text-danger text-sm">{erro}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}