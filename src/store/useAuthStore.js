import { create } from 'zustand'
import { authService } from '../services/authService'

const useAuthStore = create((set) => ({
  usuario: authService.getUsuario(),
  token: localStorage.getItem('token'),

  login: async (email, senha) => {
    const data = await authService.login(email, senha)
    set({
      usuario: { email: data.email, nome: data.nome, role: data.role },
      token: data.token,
    })
    return data
  },

  logout: () => {
    authService.logout()
    set({ usuario: null, token: null })
  },
}))

export default useAuthStore