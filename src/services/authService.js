import api from './api'

export const authService = {
  // Faz login e salva token + dados do usuário no localStorage
  login: async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify({
      email: data.email,
      nome: data.nome,
      role: data.role,
    }))
    return data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  },

  // Lê o usuário salvo do localStorage
  getUsuario: () => {
    const u = localStorage.getItem('usuario')
    return u ? JSON.parse(u) : null
  },

  isAutenticado: () => !!localStorage.getItem('token'),
  isAdmin: () => {
    const u = authService.getUsuario()
    return u?.role === 'ADMIN'
  },
}
