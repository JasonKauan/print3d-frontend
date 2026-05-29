import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api/v1'

let cache = null // cache em memória para não repetir o fetch na mesma sessão

export function useNomeEntidade() {
  const [nome, setNome] = useState(cache ?? 'Print3D')

  useEffect(() => {
    if (cache) return
    fetch(`${API}/configuracoes/publico`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.NOME_ENTIDADE) {
          cache = data.NOME_ENTIDADE
          setNome(data.NOME_ENTIDADE)
        }
      })
      .catch(() => {})
  }, [])

  return nome
}
