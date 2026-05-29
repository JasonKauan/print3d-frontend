import { useState, useEffect } from 'react'
import { fmtMoeda } from '../utils/formatters'

const API = import.meta.env.VITE_API_URL || '/api/v1'

export default function CatalogoPublico() {
  const [produtos, setProdutos]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [busca, setBusca]         = useState('')
  const [ordem, setOrdem]         = useState('nome') // nome | preco_asc | preco_desc
  const [soDisponiveis, setSoDisponiveis] = useState(false)
  const [entidade, setEntidade]   = useState('Print3D')

  useEffect(() => {
    fetch(`${API}/produtos`)
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))

    // Carrega nome da entidade via endpoint público
    fetch(`${API}/configuracoes/publico`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.NOME_ENTIDADE) setEntidade(data.NOME_ENTIDADE) })
      .catch(() => {})
  }, [])

  const filtrados = produtos
    .filter(p => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
      const matchDisp  = !soDisponiveis || p.estoque > 0
      return matchBusca && matchDisp
    })
    .sort((a, b) => {
      if (ordem === 'preco_asc')  return Number(a.preco) - Number(b.preco)
      if (ordem === 'preco_desc') return Number(b.preco) - Number(a.preco)
      return a.nome.localeCompare(b.nome)
    })

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <header className="bg-bg2 border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-accent text-lg font-bold">◈ {entidade}</span>
        <span className="text-xs text-gray-500">Catálogo de produtos</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            className="input flex-1"
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <select className="input sm:w-44" value={ordem} onChange={e => setOrdem(e.target.value)}>
            <option value="nome">A → Z</option>
            <option value="preco_asc">Menor preço</option>
            <option value="preco_desc">Maior preço</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer whitespace-nowrap px-1">
            <input type="checkbox" className="accent-accent"
              checked={soDisponiveis} onChange={e => setSoDisponiveis(e.target.checked)} />
            Só disponíveis
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-600 py-12 text-sm">Nenhum produto encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(p => (
              <div key={p.id} className="card p-0 overflow-hidden">
                {/* Foto */}
                <div className="h-44 bg-bg3 relative overflow-hidden">
                  {p.fotoUrl
                    ? <img src={p.fotoUrl} alt={p.nome}
                        className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                        sem foto
                      </div>
                  }
                  {p.estoque === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="badge-red text-xs">Indisponível</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-semibold mb-1">{p.nome}</p>
                  {p.descricao && (
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">{p.descricao}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-accent font-mono font-medium">{fmtMoeda(p.preco)}</span>
                    <span className={`text-xs ${p.estoque > 0 ? 'text-success' : 'text-danger'}`}>
                      {p.estoque > 0 ? `${p.estoque} disponível` : 'Esgotado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-10">
          {filtrados.length} produto{filtrados.length !== 1 ? 's' : ''} · {entidade}
        </p>
      </div>
    </div>
  )
}
