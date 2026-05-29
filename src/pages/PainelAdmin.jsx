import { useState, useEffect } from 'react'
import { Spinner, StatCard } from '../components/common'
import { fmtMoeda } from '../utils/formatters'
import api from '../services/api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

function useAdminData(endpoint) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get(endpoint)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [endpoint])
  return { data, loading }
}

export default function PainelAdmin() {
  const { data: dash,       loading: lDash }    = useAdminData('/admin/dashboard')
  const { data: vendasMes,  loading: lVendas }  = useAdminData('/admin/vendas-por-mes')
  const { data: impressoesMes } = useAdminData('/admin/impressoes-por-mes')
  const { data: rankProd }  = useAdminData('/admin/ranking-produtos')
  const { data: rankMembros } = useAdminData('/admin/ranking-membros')
  const { data: filVsRec }  = useAdminData('/admin/filamento-vs-receita')

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Painel Administrativo</h2>
      <p className="text-gray-500 text-sm mb-6">Visão geral da entidade em tempo real</p>

      {/* ── MÉTRICAS GERAIS ── */}
      {lDash ? <Spinner /> : dash && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Membros ativos"     value={dash.membrosAtivos}                        />
          <StatCard label="Total de impressões" value={dash.totalImpressoes}                     />
          <StatCard label="Receita total"       value={fmtMoeda(dash.receitaTotal)}   color="text-success" />
          <StatCard label="Repasse pendente"    value={fmtMoeda(dash.repassePendente)} color="text-warning" />
          <StatCard label="Impressoras livres"  value={`${dash.impressorasLivres}/${dash.totalImpressoras}`} color="text-accent" />
          <StatCard label="Impressoras ocupadas" value={dash.impressorasOcupadas}     color="text-warning" />
          <StatCard label="Rolos de filamento"  value={dash.totalFilamentos}                     />
          <StatCard label="Investido em filamento" value={fmtMoeda(dash.totalInvestidoFilamento)} color="text-danger" />
        </div>
      )}

      {/* ── FILAMENTO VS RECEITA ── */}
      {filVsRec && (
        <div className="card mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Custo de filamento vs receita</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Custo filamento</p>
              <p className="text-xl font-mono font-semibold text-danger">{fmtMoeda(filVsRec.custoFilamento)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Receita total</p>
              <p className="text-xl font-mono font-semibold text-success">{fmtMoeda(filVsRec.receita)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Lucro estimado</p>
              <p className={`text-xl font-mono font-semibold ${Number(filVsRec.lucro) >= 0 ? 'text-success' : 'text-danger'}`}>
                {fmtMoeda(filVsRec.lucro)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Margem</p>
              <p className={`text-xl font-mono font-semibold ${Number(filVsRec.margemPercent) >= 0 ? 'text-success' : 'text-danger'}`}>
                {filVsRec.margemPercent}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── GRÁFICOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Vendas por mês */}
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Vendas — últimos 6 meses</p>
          {lVendas ? <Spinner /> : vendasMes && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={vendasMes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
                <XAxis dataKey="mes" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e2333', border: '1px solid #2a2f45', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [fmtMoeda(v), 'Receita']}
                />
                <Line type="monotone" dataKey="total" stroke="#4f7cff" strokeWidth={2} dot={{ fill: '#4f7cff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Impressões por mês */}
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Impressões — últimos 6 meses</p>
          {!impressoesMes ? <Spinner /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={impressoesMes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
                <XAxis dataKey="mes" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e2333', border: '1px solid #2a2f45', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [v, 'Impressões']}
                />
                <Bar dataKey="quantidade" fill="#2ecc8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── RANKINGS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ranking de produtos */}
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Top produtos mais vendidos</p>
          {!rankProd ? <Spinner /> : rankProd.length === 0
            ? <p className="text-gray-600 text-sm text-center py-4">Nenhuma venda ainda</p>
            : (
              <div className="space-y-3">
                {rankProd.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{p.nome}</span>
                        <span className="text-xs text-gray-400">{p.totalQuantidade} unid.</span>
                      </div>
                      <div className="w-full bg-bg3 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-accent"
                          style={{ width: `${Math.min(100, (p.totalQuantidade / rankProd[0].totalQuantidade) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-success">{fmtMoeda(p.totalReceita)}</span>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Ranking de membros */}
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Top membros mais produtivos</p>
          {!rankMembros ? <Spinner /> : rankMembros.length === 0
            ? <p className="text-gray-600 text-sm text-center py-4">Nenhuma impressão ainda</p>
            : (
              <div className="space-y-3">
                {rankMembros.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-bg3 border border-border relative overflow-hidden flex items-center justify-center shrink-0">
                      {m.fotoUrl
                        ? <img src={m.fotoUrl} alt={m.nome}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none' }} />
                        : <span className="text-xs text-gray-500">{m.nome?.charAt(0)?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{m.nome}</span>
                        <span className="text-xs text-gray-400">{m.totalPecas} peças</span>
                      </div>
                      <div className="w-full bg-bg3 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-success"
                          style={{ width: `${Math.min(100, (m.totalImpressoes / rankMembros[0].totalImpressoes) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-accent">{m.totalImpressoes} impr.</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}