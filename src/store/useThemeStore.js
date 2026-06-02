import { create } from 'zustand'

export const TEMAS = [
  { id: 'navy',     label: 'Navy',     cor: '#4f7cff' },
  { id: 'midnight', label: 'Midnight', cor: '#6366f1' },
  { id: 'ocean',    label: 'Ocean',    cor: '#00c4d2' },
  { id: 'emerald',  label: 'Emerald',  cor: '#2ecc8a' },
  { id: 'crimson',  label: 'Crimson',  cor: '#ff5c7a' },
]

const temaInicial = localStorage.getItem('tema') || 'navy'
document.documentElement.setAttribute('data-theme', temaInicial)

const useThemeStore = create((set) => ({
  tema: temaInicial,

  setTema: (id) => {
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem('tema', id)
    set({ tema: id })
  },
}))

export default useThemeStore
