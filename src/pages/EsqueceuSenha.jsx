import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function EsqueceuSenha() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await api.post('/auth/esqueceu-senha', { email })
      setEnviado(true)
    } catch {
      setErro('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-mono text-accent">◈</span>
          <h1 className="text-2xl font-semibold mt-2">Print3D</h1>
          <p className="text-gray-500 text-sm mt-1">Recuperação de senha</p>
        </div>

        {enviado ? (
          <div className="card text-center">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="font-semibold mb-2">Email enviado!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Se esse email estiver cadastrado, você receberá um link para redefinir sua senha em breve.
              Verifique também a pasta de spam.
            </p>
            <Link to="/login" className="btn-primary w-full block text-center py-2">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <div className="card">
            <p className="text-gray-400 text-sm mb-4">
              Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {erro && <p className="text-danger text-sm">{erro}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-600 mt-4">
              Lembrou a senha?{' '}
              <Link to="/login" className="text-accent hover:underline">Fazer login</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}