import { Spinner, Empty } from '../components/common'
import { impressaoService } from '../services/impressaoService'
import { fmtData, fmtMoeda } from '../utils/formatters'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'

export default function Impressoes() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const { data: impressoes, loading } = useFetch(() =>
    isAdmin ? impressaoService.listar() : impressaoService.listarMembro()
  )

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-lg font-semibold">Impressões</h2>
      </div>
      <p className="text-gray-500 text-sm mb-5">
        {isAdmin ? 'Histórico de todas as impressões da entidade' : 'Suas impressões registradas'}
      </p>

      {loading ? <Spinner /> : impressoes?.length === 0
        ? <Empty text="Nenhuma impressão registrada ainda" />
        : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  {isAdmin && <th className="th">Membro</th>}
                  <th className="th">Produto</th>
                  <th className="th hidden sm:table-cell">Qtd</th>
                  <th className="th hidden md:table-cell">Filamento</th>
                  <th className="th hidden md:table-cell">Gramas</th>
                  <th className="th hidden lg:table-cell">Custo fil.</th>
                  <th className="th hidden sm:table-cell">Tempo</th>
                  <th className="th">Data</th>
                </tr>
              </thead>
              <tbody>
                {impressoes?.map(i => (
                  <tr key={i.id}>
                    {isAdmin && <td className="td font-medium">{i.membroNome}</td>}
                    <td className="td">{i.produtoNome}</td>
                    <td className="td hidden sm:table-cell text-gray-400">{i.quantidade} unid.</td>
                    <td className="td hidden md:table-cell text-gray-400 text-xs">{i.filamentoNome || '—'}</td>
                    <td className="td hidden md:table-cell text-gray-400 text-xs">
                      {i.gramasUsadas ? `${Number(i.gramasUsadas).toFixed(1)}g` : '—'}
                    </td>
                    <td className="td hidden lg:table-cell font-mono text-xs text-warning">
                      {i.custoFilamento ? fmtMoeda(i.custoFilamento) : '—'}
                    </td>
                    <td className="td hidden sm:table-cell text-gray-400 font-mono text-xs">
                      {i.tempoImpressao || '—'}
                    </td>
                    <td className="td text-gray-400 text-sm">{fmtData(i.dataImpressao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
