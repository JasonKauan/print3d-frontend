import { useState, useEffect, useCallback } from 'react'

// Hook reutilizável para qualquer chamada GET à API
// Uso: const { data, loading, error, refetch } = useFetch(() => membroService.listar())
const useFetch = (fetchFn, deps = []) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchFn()
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export default useFetch
