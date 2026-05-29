import { useState } from 'react'
import { Spinner, Empty, Toast, Modal, FormGroup, ModalConfirm } from '../components/common'
import { fmtMoeda } from '../utils/formatters'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'
import api from '../services/api'

const TIPO_LABEL = {
  ENTRADA_CADASTRO:      { label: 'Cadastro',      cor: 'badge-green'  },
  ENTRADA_IMPRESSAO:     { label: 'Impressão',     cor: 'badge-blue'   },
  SAIDA_VENDA:           { label: 'Venda',         cor: 'badge-red'    },
  AJUSTE_MANUAL_ENTRADA: { label: 'Ajuste +',      cor: 'badge-green'  },
  AJUSTE_MANUAL_SAIDA:   { label: 'Ajuste -',      cor: 'badge-amber'  },
  CONSUMO_FILAMENTO:     { label: 'Consumo',       cor: 'badge-red'    },
}

function fmtData(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function Estoque() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const [filtro, setFiltro] = useState('TODOS') // TODOS | PRODUTO | FILAMENTO
  const [modalAjuste, setModalAjuste] = useState(null) // { tipo: 'produto'|'filamento' }
  const [ajusteForm, setAjusteForm]   = useState({ valor: '', justificativa: '' })
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState(null)

  const { data: movimentacoes, loading, refetch } = useFetch(() => {
    if (filtro === 'TODOS') return api.get('/estoque')
    return api.get(`/estoque?tipo=${filtro}`)
  }, [filtro])

  const { data: produtos }   = useFetch(() => api.get('/produtos'))
  const { data: filamentos } = useFetch(() => api.get('/filamentos'))

  const salvarAjuste = async () => {
    if (!ajusteForm.valor || !ajusteForm.justificativa) return
    setSaving(true)
    try {
      if (modalAjuste.tipo === 'produto') {
        await api.post(`/estoque/ajuste/produto/${modalAjuste.itemId}`, {
          novoEstoque: ajusteForm.valor,
          justificativa: ajusteForm.justificativa,
        })
      } else {
        await api.post(`/estoque/ajuste/filamento/${modalAjuste.itemId}`, {
          novoDisponivel: ajusteForm.valor,
          justificativa: ajusteForm.justificativa,
        })
      }
      setToast({ msg: 'Ajuste registrado!', type: 'success' })
      setModalAjuste(null)
      setAjusteForm({ valor: '', justificativa: '' })
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao ajustar.', type: 'error' })
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Histórico de Estoque</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <select className="input text-xs py-1"
              onChange={e => {
                const [tipo, id] = e.target.value.split('|')
                if (!id) return
                setModalAjuste({ tipo, itemId: id })
                setAjusteForm({ valor: '', justificativa: '' })
                e.target.value = ''
              }}
              defaultValue=""
            >
              <option value="" disabled>⚙ Ajuste manual</option>
              <optgroup label="Produtos">
                {produtos?.map(p => (
                  <option key={p.id} value={`produto|${p.id}`}>{p.nome} ({p.estoque} un.)</option>
                ))}
              </optgroup>
              <optgroup label="Filamentos">
                {filamentos?.map(f => (
                  <option key={f.id} value={`filamento|${f.id}`}>{f.nome} ({Number(f.pesoDisponivelGramas).toFixed(0)}g)</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-5">Todas as entradas e saídas de produtos e filamentos</p>

      {/* Filtros */}
      <div className="flex gap-1 mb-5 bg-bg2 border border-border rounded-xl p-1 w-fit">
        {['TODOS', 'PRODUTO', 'FILAMENTO'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filtro === f ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {f === 'TODOS' ? 'Todos' : f === 'PRODUTO' ? 'Produtos' : 'Filamentos'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Item</th>
                <th className="th">Tipo</th>
                <th className="th hidden sm:table-cell">Qtd / Gramas</th>
                <th className="th hidden md:table-cell">Antes → Depois</th>
                <th className="th hidden lg:table-cell">Responsável</th>
                <th className="th">Data</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes?.length === 0 && (
                <tr><td colSpan={6}><Empty text="Nenhuma movimentação ainda" /></td></tr>
              )}
              {movimentacoes?.map(m => {
                const meta = TIPO_LABEL[m.tipo] || { label: m.tipo, cor: 'badge-green' }
                const isEntrada = m.quantidade > 0
                return (
                  <tr key={m.id}>
                    <td className="td">
                      <div>
                        <p className="font-medium text-sm">{m.itemNome}</p>
                        <p className="text-xs text-gray-500">{m.tipoItem === 'PRODUTO' ? 'Produto' : 'Filamento'}</p>
                      </div>
                    </td>
                    <td className="td"><span className={meta.cor}>{meta.label}</span></td>
                    <td className="td hidden sm:table-cell">
                      <span className={`font-mono font-medium ${isEntrada ? 'text-success' : 'text-danger'}`}>
                        {isEntrada ? '+' : ''}{Number(m.quantidade).toFixed(m.tipoItem === 'FILAMENTO' ? 1 : 0)}
                        {m.tipoItem === 'FILAMENTO' ? 'g' : ' un.'}
                      </span>
                    </td>
                    <td className="td hidden md:table-cell text-xs text-gray-400 font-mono">
                      {Number(m.estoqueAntes).toFixed(m.tipoItem === 'FILAMENTO' ? 1 : 0)}
                      {m.tipoItem === 'FILAMENTO' ? 'g' : ''}
                      {' → '}
                      {Number(m.estoqueDepois).toFixed(m.tipoItem === 'FILAMENTO' ? 1 : 0)}
                      {m.tipoItem === 'FILAMENTO' ? 'g' : ''}
                    </td>
                    <td className="td hidden lg:table-cell text-gray-400 text-sm">{m.membroNome}</td>
                    <td className="td text-gray-400 text-xs">{fmtData(m.criadoEm)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ajuste manual */}
      {modalAjuste && (
        <Modal
          title={`Ajuste manual — ${modalAjuste.tipo === 'produto' ? 'Produto' : 'Filamento'}`}
          onClose={() => setModalAjuste(null)}
        >
          <p className="text-gray-400 text-sm mb-4">
            Informe o novo valor de estoque e a justificativa. A diferença será registrada no histórico.
          </p>
          <FormGroup label={modalAjuste.tipo === 'produto' ? 'Novo estoque (unidades)' : 'Novo disponível (gramas)'}>
            <input className="input" type="number" step={modalAjuste.tipo === 'produto' ? '1' : '0.1'} min="0"
              value={ajusteForm.valor}
              onChange={e => setAjusteForm(f => ({ ...f, valor: e.target.value }))}
              placeholder={modalAjuste.tipo === 'produto' ? 'Ex: 10' : 'Ex: 450.5'} />
          </FormGroup>
          <FormGroup label="Justificativa *">
            <textarea className="input min-h-[72px] resize-y"
              value={ajusteForm.justificativa}
              onChange={e => setAjusteForm(f => ({ ...f, justificativa: e.target.value }))}
              placeholder="Ex: Contagem física, produto danificado..." />
          </FormGroup>
          <button className="btn-primary w-full mt-1" onClick={salvarAjuste} disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar ajuste'}
          </button>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}