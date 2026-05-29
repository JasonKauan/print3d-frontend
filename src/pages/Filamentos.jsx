import { useState, useMemo } from 'react'
import { Modal, ModalConfirm, Spinner, Empty, FormGroup, Toast, StatCard } from '../components/common'
import { filamentoService } from '../services/filamentoService'
import { fmtMoeda } from '../utils/formatters'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'

const FORM_INICIAL = { nome: '', marca: '', cor: '', tipo: '', pesoTotalGramas: '', precoPago: '', dataCompra: '' }

const STATUS_COR = {
  DISPONIVEL: 'badge-green',
  ESGOTADO:   'badge-red',
  RESERVADO:  'badge-amber',
}

const STATUS_LABEL = {
  DISPONIVEL: 'Disponível',
  ESGOTADO:   'Esgotado',
  RESERVADO:  'Reservado',
}

export default function Filamentos() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const { data: filamentos, loading, refetch } = useFetch(() => filamentoService.listar())
  const { data: totalData }    = useFetch(() => filamentoService.totalInvestido())
  const { data: analyticsData } = useFetch(() => isAdmin ? filamentoService.analytics() : Promise.resolve({ data: [] }))

  // Mapa filamentoId → analytics
  const analyticsMap = {}
  analyticsData?.forEach?.(a => { analyticsMap[a.id] = a })

  const [abaAtiva, setAbaAtiva] = useState('rolos') // rolos | comparativo

  const [modal, setModal]         = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState(FORM_INICIAL)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState(null)

  const abrirCriar = () => { setEditando(null); setForm(FORM_INICIAL); setModal(true) }
  const abrirEditar = (f) => {
    setEditando(f)
    setForm({
      nome: f.nome, marca: f.marca || '', cor: f.cor || '',
      tipo: f.tipo || '', pesoTotalGramas: f.pesoTotalGramas,
      precoPago: f.precoPago, dataCompra: f.dataCompra || '',
    })
    setModal(true)
  }

  const salvar = async () => {
    if (!form.nome || !form.pesoTotalGramas || !form.precoPago) return
    setSaving(true)
    try {
      if (editando) {
        await filamentoService.atualizar(editando.id, form)
        setToast({ msg: 'Filamento atualizado!', type: 'success' })
      } else {
        await filamentoService.criar(form)
        setToast({ msg: 'Filamento cadastrado!', type: 'success' })
      }
      setModal(false); refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar.', type: 'error' })
    } finally { setSaving(false) }
  }

  const confirmarDeletar = async () => {
    try {
      await filamentoService.deletar(confirmar.id)
      setToast({ msg: 'Filamento removido.', type: 'info' })
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao remover.', type: 'error' })
    } finally { setConfirmar(null) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Calcula custo por grama em tempo real no formulário
  const custoPorGramaPreview = form.precoPago && form.pesoTotalGramas
    ? (Number(form.precoPago) / Number(form.pesoTotalGramas)).toFixed(4)
    : null

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Filamentos</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={abrirCriar}>+ Novo rolo</button>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-5">Controle de estoque e custo de filamento</p>

      {/* Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total de rolos" value={filamentos?.length ?? 0} />
          <StatCard label="Disponíveis"
            value={filamentos?.filter(f => f.status === 'DISPONIVEL').length ?? 0}
            color="text-success" />
          <StatCard label="Esgotados"
            value={filamentos?.filter(f => f.status === 'ESGOTADO').length ?? 0}
            color="text-danger" />
          <StatCard label="Total investido"
            value={fmtMoeda(totalData?.total ?? 0)}
            color="text-warning" />
        </div>
      )}

      {/* Alerta de sugestão de compra */}
      {isAdmin && analyticsData?.some?.(a => a.sugerirCompra) && (
        <div className="bg-amber-900/20 border border-warning rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
          <span className="text-warning text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-medium text-warning">Sugestão de compra</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {analyticsData.filter(a => a.sugerirCompra).map(a =>
                `${a.nome} (${a.mesesRestantes !== null ? `~${a.mesesRestantes} mês` : 'sem histórico'})`
              ).join(', ')} — estoque baixo baseado no consumo médio.
            </p>
          </div>
        </div>
      )}

      {/* Abas — só admin vê comparativo */}
      {isAdmin && (
        <div className="flex gap-1 mb-5 border-b border-border">
          {[['rolos', 'Rolos'], ['comparativo', 'Comparativo de custo']].map(([key, label]) => (
            <button key={key} onClick={() => setAbaAtiva(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                abaAtiva === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : filamentos?.length === 0
        ? <Empty text="Nenhum filamento cadastrado ainda" />
        : abaAtiva === 'comparativo' ? (
          /* ── Aba Comparativo ── */
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Filamento</th>
                  <th className="th">Tipo</th>
                  <th className="th text-right">Custo/g</th>
                  <th className="th text-right">Disponível</th>
                  <th className="th text-right hidden sm:table-cell">Consumo/mês</th>
                  <th className="th text-right hidden md:table-cell">Meses restantes</th>
                </tr>
              </thead>
              <tbody>
                {[...(analyticsData ?? [])]
                  .sort((a, b) => Number(a.custoPorGrama) - Number(b.custoPorGrama))
                  .map((a, i) => (
                    <tr key={a.id} className={i % 2 === 0 ? '' : 'bg-bg3/40'}>
                      <td className="td font-medium">
                        <div className="flex items-center gap-2">
                          {a.sugerirCompra && <span title="Comprar em breve">⚠️</span>}
                          {a.nome}
                          {a.cor && <span className="text-xs text-gray-500">· {a.cor}</span>}
                        </div>
                      </td>
                      <td className="td text-gray-400">{a.tipo || '—'}</td>
                      <td className="td text-right font-mono text-warning">
                        R$ {Number(a.custoPorGrama).toFixed(4)}
                      </td>
                      <td className="td text-right">{Number(a.pesoDisponivel).toFixed(0)}g</td>
                      <td className="td text-right hidden sm:table-cell text-gray-400">
                        {Number(a.consumoMedioMensal) > 0
                          ? `${Number(a.consumoMedioMensal).toFixed(0)}g`
                          : '—'}
                      </td>
                      <td className="td text-right hidden md:table-cell">
                        {a.mesesRestantes !== null
                          ? <span className={Number(a.mesesRestantes) <= 2 ? 'text-danger font-medium' : 'text-success'}>
                              ~{a.mesesRestantes} mês
                            </span>
                          : <span className="text-gray-600">—</span>
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Aba Rolos ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filamentos?.map(f => {
              const analytics = analyticsMap[f.id]
              return (
              <div key={f.id} className="card p-0 overflow-hidden hover:border-accent transition-colors">
                {/* Header */}
                <div className="px-4 py-3 bg-bg3 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{f.nome}</p>
                    <p className="text-xs text-gray-400">
                      {[f.marca, f.tipo, f.cor].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={STATUS_COR[f.status]}>{STATUS_LABEL[f.status]}</span>
                    {analytics?.sugerirCompra && (
                      <span className="badge-amber text-[10px]">⚠️ Comprar</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Barra de progresso do rolo */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{Number(f.pesoDisponivelGramas).toFixed(0)}g disponíveis</span>
                      <span>{Number(f.pesoTotalGramas).toFixed(0)}g total</span>
                    </div>
                    <div className="w-full bg-bg3 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          f.percentualUsado > 80 ? 'bg-danger' :
                          f.percentualUsado > 50 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${100 - f.percentualUsado}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{f.percentualUsado}% usado</p>
                  </div>

                  {/* Custos */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-bg3 rounded-lg p-2">
                      <p className="text-gray-400">Preço pago</p>
                      <p className="font-mono font-medium text-accent">{fmtMoeda(f.precoPago)}</p>
                    </div>
                    <div className="bg-bg3 rounded-lg p-2">
                      <p className="text-gray-400">Custo/grama</p>
                      <p className="font-mono font-medium text-warning">
                        R$ {Number(f.custoPorGrama).toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Analytics inline — consumo médio */}
                  {isAdmin && analytics && Number(analytics.consumoMedioMensal) > 0 && (
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Consumo médio</span>
                      <span className="font-mono">{Number(analytics.consumoMedioMensal).toFixed(0)}g/mês</span>
                    </div>
                  )}

                  {/* Ações admin */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-1 border-t border-border">
                      <button className="btn-ghost text-xs flex-1" onClick={() => abrirEditar(f)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => setConfirmar({ id: f.id, nome: f.nome })}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        )}

      {modal && (
        <Modal title={editando ? 'Editar filamento' : 'Novo rolo de filamento'} onClose={() => setModal(false)}>
          <FormGroup label="Nome *">
            <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: PLA Branco, PETG Preto..." />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Marca">
              <input className="input" value={form.marca} onChange={e => set('marca', e.target.value)}
                placeholder="Ex: Polymaker" />
            </FormGroup>
            <FormGroup label="Tipo">
              <input className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}
                placeholder="Ex: PLA, PETG, ABS" />
            </FormGroup>
          </div>
          <FormGroup label="Cor">
            <input className="input" value={form.cor} onChange={e => set('cor', e.target.value)}
              placeholder="Ex: Branco, Preto, Azul..." />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Peso total (gramas) *">
              <input className="input" type="number" step="1" value={form.pesoTotalGramas}
                onChange={e => set('pesoTotalGramas', e.target.value)} placeholder="Ex: 1000" />
            </FormGroup>
            <FormGroup label="Preço pago (R$) *">
              <input className="input" type="number" step="0.01" value={form.precoPago}
                onChange={e => set('precoPago', e.target.value)} placeholder="Ex: 120.00" />
            </FormGroup>
          </div>
          <FormGroup label="Data de compra">
            <input className="input" type="date" value={form.dataCompra}
              onChange={e => set('dataCompra', e.target.value)} />
          </FormGroup>

          {/* Preview do custo por grama */}
          {custoPorGramaPreview && (
            <div className="bg-bg3 border border-border rounded-lg px-4 py-3 text-sm mb-2">
              <span className="text-gray-400">Custo por grama: </span>
              <span className="text-warning font-mono font-medium">R$ {custoPorGramaPreview}/g</span>
            </div>
          )}

          <button className="btn-primary w-full mt-1" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar filamento'}
          </button>
        </Modal>
      )}

      {confirmar && (
        <ModalConfirm
          titulo="Remover filamento"
          mensagem={`Tem certeza que deseja remover "${confirmar.nome}"?`}
          onConfirmar={confirmarDeletar}
          onCancelar={() => setConfirmar(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}