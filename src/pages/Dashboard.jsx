import { useEffect, useState } from 'react'
import { StatCard, Spinner, Empty } from '../components/common'
import { impressaoService } from '../services/impressaoService'
import { vendaService } from '../services/vendaService'
import { fmtData, fmtMoeda } from '../utils/formatters'
import useAuthStore from '../store/useAuthStore'
import api from '../services/api'

export default function Dashboard() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const [stats, setStats]           = useState(null)
  const [impressoes, setImpressoes] = useState([])
  const [pendentes, setPendentes]   = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          // Admin vê dados gerais
          const [impr, vendas, membrosRes] = await Promise.all([
            impressaoService.listar(),
            vendaService.listar(),
            api.get('/membros'),
          ])

          const totalVendas    = vendas.data.reduce((s, v) => s + Number(v.valorTotal), 0)
          const totalRepassado = vendas.data.filter(v => v.statusRepasse === 'PAGO')
                                            .reduce((s, v) => s + Number(v.repasse), 0)
          const pendentesArr   = vendas.data.filter(v => v.statusRepasse === 'PENDENTE')

          setStats({
            membrosAtivos:   membrosRes.data.filter(m => m.status === 'ATIVO').length,
            totalImpressoes: impr.data.length,
            totalVendido:    totalVendas,
            totalRepassado,
            pendentes:       pendentesArr.length,
          })
          setImpressoes(impr.data.slice(0, 5))
          setPendentes(pendentesArr.slice(0, 5))
        } else {
          // Membro vê só os próprios dados
          const [impr, vendas] = await Promise.all([
            impressaoService.listarMembro(usuario?.id),
            vendaService.listar(),
          ])

          const totalVendas    = vendas.data.reduce((s, v) => s + Number(v.valorTotal), 0)
          const totalRepasse   = vendas.data.reduce((s, v) => s + Number(v.repasse), 0)
          const totalPago      = vendas.data.filter(v => v.statusRepasse === 'PAGO')
                                            .reduce((s, v) => s + Number(v.repasse), 0)
          const pendentesArr   = vendas.data.filter(v => v.statusRepasse === 'PENDENTE')

          setStats({
            totalImpressoes: impr.data.length,
            totalVendido:    totalVendas,
            totalRepasse,
            totalPago,
            pendentes:       pendentesArr.length,
          })
          setImpressoes(impr.data.slice(0, 5))
          setPendentes(pendentesArr.slice(0, 5))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin, usuario?.id])

  if (loading) return <Spinner />

  return (
    <div>
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <p className="text-gray-500 text-sm mb-5">
        {isAdmin ? 'Visão geral da entidade' : `Olá, ${usuario?.nome}! Veja seu resumo.`}
      </p>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {isAdmin && (
          <StatCard label="Membros ativos" value={stats?.membrosAtivos} color="text-accent" />
        )}
        <StatCard label="Impressões"       value={stats?.totalImpressoes} />
        <StatCard label="Total vendido"    value={fmtMoeda(stats?.totalVendido)}    color="text-success" />
        {isAdmin
          ? <StatCard label="Total repassado" value={fmtMoeda(stats?.totalRepassado)} color="text-warning" />
          : <StatCard label="Já repassado"    value={fmtMoeda(stats?.totalPago)}      color="text-warning" />
        }
        <StatCard label="Repasses pendentes" value={stats?.pendentes} color="text-danger" />
        {!isAdmin && (
          <StatCard label="A receber" value={fmtMoeda(stats?.totalRepasse - (stats?.totalPago || 0))} color="text-accent" />
        )}
      </div>

      {/* Últimas impressões */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm mb-4">
          {isAdmin ? 'Últimas impressões' : 'Minhas últimas impressões'}
        </h3>
        {impressoes.length === 0 ? <Empty text="Nenhuma impressão ainda" /> : (
          <table className="w-full">
            <thead>
              <tr>
                {isAdmin && <th className="th">Membro</th>}
                <th className="th">Produto</th>
                <th className="th hidden sm:table-cell">Qtd</th>
                <th className="th">Data</th>
              </tr>
            </thead>
            <tbody>
              {impressoes.map(i => (
                <tr key={i.id}>
                  {isAdmin && <td className="td font-medium">{i.membroNome}</td>}
                  <td className="td">{i.produtoNome}</td>
                  <td className="td hidden sm:table-cell">{i.quantidade}</td>
                  <td className="td text-gray-400">{fmtData(i.dataImpressao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Repasses pendentes */}
      <div className="card">
        <h3 className="font-semibold text-sm mb-4">
          {isAdmin ? 'Repasses pendentes' : 'Meus repasses pendentes'}
        </h3>
        {pendentes.length === 0 ? <Empty text="Nenhum repasse pendente 🎉" /> : (
          <table className="w-full">
            <thead>
              <tr>
                {isAdmin && <th className="th">Membro</th>}
                <th className="th">Produto</th>
                <th className="th">Repasse</th>
                <th className="th">Data</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map(v => (
                <tr key={v.id}>
                  {isAdmin && <td className="td font-medium">{v.membroNome}</td>}
                  <td className="td">{v.produtoNome}</td>
                  <td className="td font-mono text-warning">{fmtMoeda(v.repasse)}</td>
                  <td className="td text-gray-400">{fmtData(v.dataVenda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
