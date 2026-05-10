import { useEffect, useState } from 'react'
import { StatCard, Spinner, Empty } from '../components/common'
import { membroService } from '../services/membroService'
import { impressaoService } from '../services/impressaoService'
import { vendaService } from '../services/vendaService'
import { fmtData, fmtMoeda } from '../utils/formatters'

export default function Dashboard() {
  const [stats, setStats]           = useState(null)
  const [impressoes, setImpressoes] = useState([])
  const [pendentes, setPendentes]   = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [membros, impr, vendas, resumo] = await Promise.all([
          membroService.listar('ATIVO'),
          impressaoService.listar(),
          vendaService.listar(),
          vendaService.resumoGeral(),
        ])

        const totalVendas   = vendas.data.reduce((s, v) => s + Number(v.valorTotal), 0)
        const totalRepassado= vendas.data.filter(v => v.statusRepasse === 'PAGO')
                                         .reduce((s, v) => s + Number(v.repasse), 0)
        const pendentesArr  = vendas.data.filter(v => v.statusRepasse === 'PENDENTE')

        setStats({
          membrosAtivos:  membros.data.length,
          totalImpressoes: impr.data.length,
          totalVendido:   totalVendas,
          totalRepassado,
          pendentes:      pendentesArr.length,
          produtos:       resumo.data.length,
        })
        setImpressoes(impr.data.slice(0, 5))
        setPendentes(pendentesArr.slice(0, 5))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <p className="text-gray-500 text-sm mb-5">Visão geral da entidade</p>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Membros ativos"    value={stats?.membrosAtivos}              color="text-accent"  />
        <StatCard label="Impressões"        value={stats?.totalImpressoes}                                 />
        <StatCard label="Total vendido"     value={fmtMoeda(stats?.totalVendido)}     color="text-success" />
        <StatCard label="Total repassado"   value={fmtMoeda(stats?.totalRepassado)}   color="text-warning" />
        <StatCard label="Repasses pendentes" value={stats?.pendentes}                 color="text-danger"  />
        <StatCard label="Produtores"        value={stats?.produtos}                                        />
      </div>

      {/* Últimas impressões */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm mb-4">Últimas impressões</h3>
        {impressoes.length === 0 ? <Empty text="Nenhuma impressão ainda" /> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Membro</th>
                <th className="th">Produto</th>
                <th className="th">Qtd</th>
                <th className="th">Data</th>
              </tr>
            </thead>
            <tbody>
              {impressoes.map(i => (
                <tr key={i.id}>
                  <td className="td font-medium">{i.membroNome}</td>
                  <td className="td">{i.produtoNome}</td>
                  <td className="td">{i.quantidade}</td>
                  <td className="td text-gray-400">{fmtData(i.dataImpressao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Repasses pendentes */}
      <div className="card">
        <h3 className="font-semibold text-sm mb-4">Repasses pendentes</h3>
        {pendentes.length === 0 ? <Empty text="Nenhum repasse pendente" /> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Membro</th>
                <th className="th">Produto</th>
                <th className="th">Repasse</th>
                <th className="th">Data</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map(v => (
                <tr key={v.id}>
                  <td className="td font-medium">{v.membroNome}</td>
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
