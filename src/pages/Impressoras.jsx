import { useState } from 'react'
import { Modal, ModalConfirm, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { impressoraService } from '../services/impressoraService'
import { filamentoService } from '../services/filamentoService'
import { produtoService } from '../services/produtoService'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'

const FORM_INICIAL = { nome: '', modelo: '', observacao: '' }
const FINALIZAR_FORM = { tempoReal: '', gramasUsadas: '', observacao: '' }

const STATUS_CORES = {
  LIVRE:      { bg: 'bg-green-900/30', border: 'border-success', badge: 'badge-green', label: 'Livre' },
  OCUPADA:    { bg: 'bg-amber-900/30', border: 'border-warning', badge: 'badge-amber', label: 'Ocupada' },
  MANUTENCAO: { bg: 'bg-red-900/30',   border: 'border-danger',  badge: 'badge-red',   label: 'Manutenção' },
}

export default function Impressoras() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const { data: impressoras, loading, refetch } = useFetch(() => impressoraService.listar())
  const { data: filamentos }                     = useFetch(() => filamentoService.listarDisponiveis())
  const { data: produtos }                       = useFetch(() => produtoService.listar())

  const [modal, setModal]                   = useState(false)
  const [modalUsar, setModalUsar]           = useState(null)
  const [modalFinalizar, setModalFinalizar] = useState(null)
  const [confirmar, setConfirmar]           = useState(null)
  const [editando, setEditando]             = useState(null)
  const [form, setForm]                     = useState(FORM_INICIAL)
  const [finalizarForm, setFinalizarForm]   = useState(FINALIZAR_FORM)
  const [usarForm, setUsarForm]             = useState({ produtoNome: '', quantidade: 1, filamentoId: '', gramasEstimadas: '' })
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState(null)

  const abrirCriar = () => { setEditando(null); setForm(FORM_INICIAL); setModal(true) }
  const abrirEditar = (imp) => {
    setEditando(imp)
    setForm({ nome: imp.nome, modelo: imp.modelo || '', observacao: imp.observacao || '' })
    setModal(true)
  }

  const salvar = async () => {
    if (!form.nome) return
    setSaving(true)
    try {
      if (editando) {
        await impressoraService.atualizar(editando.id, form)
        setToast({ msg: 'Impressora atualizada!', type: 'success' })
      } else {
        await impressoraService.criar(form)
        setToast({ msg: 'Impressora cadastrada!', type: 'success' })
      }
      setModal(false); refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar.', type: 'error' })
    } finally { setSaving(false) }
  }

  const iniciarUso = async () => {
    if (!usarForm.produtoNome) return
    setSaving(true)
    try {
      await impressoraService.iniciarUso(modalUsar.id, {
        produtoNome: usarForm.produtoNome,
        quantidade: usarForm.quantidade,
        filamentoId: usarForm.filamentoId || null,
        gramasEstimadas: usarForm.gramasEstimadas || null,
      })
      setToast({ msg: `Usando ${modalUsar.nome}! Boa impressão!`, type: 'success' })
      setModalUsar(null)
      setUsarForm({ produtoNome: '', quantidade: 1, filamentoId: '', gramasEstimadas: '' })
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao iniciar uso.', type: 'error' })
    } finally { setSaving(false) }
  }

  const finalizar = async () => {
    setSaving(true)
    try {
      await impressoraService.finalizarUso(modalFinalizar.id, {
        tempoReal: finalizarForm.tempoReal,
        gramasUsadas: finalizarForm.gramasUsadas || null,
        observacao: finalizarForm.observacao,
      })
      setToast({ msg: 'Impressão finalizada e registrada automaticamente!', type: 'success' })
      setModalFinalizar(null)
      setFinalizarForm(FINALIZAR_FORM)
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao finalizar.', type: 'error' })
    } finally { setSaving(false) }
  }

  const alterarStatus = async (id, status) => {
    try {
      await impressoraService.alterarStatus(id, status)
      setToast({ msg: 'Status atualizado!', type: 'success' })
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro.', type: 'error' })
    }
  }

  const confirmarDeletar = async () => {
    try {
      await impressoraService.deletar(confirmar.id)
      setToast({ msg: 'Impressora removida.', type: 'info' })
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao remover.', type: 'error' })
    } finally { setConfirmar(null) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const minhaImpressora = impressoras?.find(i => i.membroAtualNome === usuario?.nome)

  // Filamento selecionado no modal de usar — pra mostrar custo/grama
  const filamentoSelecionado = filamentos?.find(f => String(f.id) === String(usarForm.filamentoId))
  const custoEstimado = filamentoSelecionado && usarForm.gramasEstimadas
    ? (Number(usarForm.gramasEstimadas) * Number(filamentoSelecionado.custoPorGrama)).toFixed(2)
    : null

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Impressoras</h2>
        {isAdmin && <button className="btn-primary" onClick={abrirCriar}>+ Nova impressora</button>}
      </div>
      <p className="text-gray-500 text-sm mb-5">
        {isAdmin ? 'Gerencie as impressoras da entidade' : 'Veja a disponibilidade e inicie seu uso'}
      </p>

      {loading ? <Spinner /> : impressoras?.length === 0
        ? <Empty text="Nenhuma impressora cadastrada ainda" />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {impressoras?.map(imp => {
              const cores = STATUS_CORES[imp.status]
              const euEstouUsando = imp.membroAtualNome === usuario?.nome

              return (
                <div key={imp.id} className={`card p-0 overflow-hidden border-2 ${cores.border} transition-all`}>
                  <div className={`${cores.bg} px-4 py-3 flex justify-between items-center`}>
                    <div>
                      <p className="font-semibold text-sm">{imp.nome}</p>
                      {imp.modelo && <p className="text-xs text-gray-400">{imp.modelo}</p>}
                    </div>
                    <span className={cores.badge}>{cores.label}</span>
                  </div>

                  <div className="p-4">
                    {imp.status === 'OCUPADA' && imp.membroAtualNome && (
                      <div className="flex items-center gap-3 mb-3 p-3 bg-bg3 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-bg border border-border relative overflow-hidden flex items-center justify-center shrink-0">
                          {imp.membroAtualFoto
                            ? <img src={imp.membroAtualFoto} alt={imp.membroAtualNome}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none' }} />
                            : <span className="text-xs text-gray-500 font-medium">
                                {imp.membroAtualNome?.charAt(0)?.toUpperCase()}
                              </span>
                          }
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Usando agora</p>
                          <p className="text-sm font-medium">{euEstouUsando ? 'Você' : imp.membroAtualNome}</p>
                          {imp.produtoEmImpressao && (
                            <p className="text-xs text-gray-500">{imp.produtoEmImpressao} × {imp.quantidadeEmImpressao}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {imp.status === 'MANUTENCAO' && imp.observacao && (
                      <p className="text-xs text-gray-500 mb-3 italic">{imp.observacao}</p>
                    )}

                    {!isAdmin && (
                      <div className="space-y-2">
                        {imp.status === 'LIVRE' && !minhaImpressora && (
                          <button className="btn-primary w-full"
                            onClick={() => { setModalUsar(imp); setUsarForm({ produtoNome: '', quantidade: 1, filamentoId: '', gramasEstimadas: '' }) }}>
                            Usar esta impressora
                          </button>
                        )}
                        {euEstouUsando && (
                          <button className="w-full py-2 rounded-lg bg-success text-bg font-medium text-sm"
                            onClick={() => { setModalFinalizar(imp); setFinalizarForm(FINALIZAR_FORM) }}>
                            ✓ Finalizar minha impressão
                          </button>
                        )}
                        {imp.status === 'OCUPADA' && !euEstouUsando && (
                          <p className="text-xs text-gray-500 text-center">Em uso por {imp.membroAtualNome}</p>
                        )}
                        {minhaImpressora && !euEstouUsando && imp.status === 'LIVRE' && (
                          <p className="text-xs text-gray-500 text-center">Finalize seu uso atual primeiro</p>
                        )}
                      </div>
                    )}

                    {isAdmin && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button className="btn-ghost text-xs flex-1" onClick={() => abrirEditar(imp)}>Editar</button>
                          <button className="btn-danger" onClick={() => setConfirmar({ id: imp.id, nome: imp.nome })}>✕</button>
                        </div>
                        {imp.status === 'LIVRE' && (
                          <button className="btn-primary w-full text-xs"
                            onClick={() => { setModalUsar(imp); setUsarForm({ produtoNome: '', quantidade: 1, filamentoId: '', gramasEstimadas: '' }) }}>
                            Usar impressora
                          </button>
                        )}
                        {imp.status === 'OCUPADA' && (
                          <button className="btn-ghost w-full text-xs"
                            onClick={() => { setModalFinalizar(imp); setFinalizarForm(FINALIZAR_FORM) }}>
                            Finalizar uso forçado
                          </button>
                        )}
                        <div className="flex gap-2">
                          {imp.status !== 'LIVRE' && (
                            <button className="btn-ghost text-xs flex-1 text-success"
                              onClick={() => alterarStatus(imp.id, 'LIVRE')}>Liberar</button>
                          )}
                          {imp.status !== 'MANUTENCAO' && (
                            <button className="btn-ghost text-xs flex-1 text-danger"
                              onClick={() => alterarStatus(imp.id, 'MANUTENCAO')}>Manutenção</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {/* Modal criar/editar */}
      {modal && (
        <Modal title={editando ? 'Editar impressora' : 'Nova impressora'} onClose={() => setModal(false)}>
          <FormGroup label="Nome *">
            <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Impressora 1, Ender 3..." />
          </FormGroup>
          <FormGroup label="Modelo">
            <input className="input" value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Ex: Creality Ender 3 Pro" />
          </FormGroup>
          <FormGroup label="Observações">
            <textarea className="input min-h-[64px] resize-y" value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Informações adicionais..." />
          </FormGroup>
          <button className="btn-primary w-full mt-1" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar impressora'}
          </button>
        </Modal>
      )}

      {/* Modal iniciar uso */}
      {modalUsar && (
        <Modal title={`Usar ${modalUsar.nome}`} onClose={() => setModalUsar(null)}>
          <p className="text-gray-400 text-sm mb-4">
            A impressora será marcada como ocupada imediatamente.
          </p>
          <FormGroup label="Produto a imprimir *">
            <select className="input" value={usarForm.produtoNome}
              onChange={e => setUsarForm(f => ({ ...f, produtoNome: e.target.value }))}>
              <option value="">Selecione um produto...</option>
              {produtos?.map(p => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Quantidade">
            <input className="input" type="number" min="1" value={usarForm.quantidade}
              onChange={e => setUsarForm(f => ({ ...f, quantidade: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Filamento (opcional)">
            <select className="input" value={usarForm.filamentoId}
              onChange={e => setUsarForm(f => ({ ...f, filamentoId: e.target.value }))}>
              <option value="">Selecione um filamento...</option>
              {filamentos?.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.cor ? `— ${f.cor}` : ''} ({Number(f.pesoDisponivelGramas).toFixed(0)}g disponíveis)
                </option>
              ))}
            </select>
          </FormGroup>
          {usarForm.filamentoId && (
            <FormGroup label="Gramas estimadas">
              <input className="input" type="number" step="0.1" value={usarForm.gramasEstimadas}
                onChange={e => setUsarForm(f => ({ ...f, gramasEstimadas: e.target.value }))}
                placeholder="Ex: 45.5" />
            </FormGroup>
          )}
          {custoEstimado && (
            <div className="bg-bg3 border border-border rounded-lg px-4 py-3 text-sm mb-3">
              <span className="text-gray-400">Custo estimado de filamento: </span>
              <span className="text-warning font-mono font-medium">R$ {custoEstimado}</span>
            </div>
          )}
          <button className="btn-primary w-full" onClick={iniciarUso} disabled={saving}>
            {saving ? 'Iniciando...' : 'Iniciar uso'}
          </button>
        </Modal>
      )}

      {/* Modal finalizar uso */}
      {modalFinalizar && (
        <Modal title={`Finalizar — ${modalFinalizar.nome}`} onClose={() => setModalFinalizar(null)}>
          <p className="text-gray-400 text-sm mb-4">
            A impressão será registrada automaticamente no histórico.
          </p>
          <FormGroup label="Tempo real de impressão">
            <input className="input" value={finalizarForm.tempoReal}
              onChange={e => setFinalizarForm(f => ({ ...f, tempoReal: e.target.value }))}
              placeholder="Ex: 3h45min" />
          </FormGroup>
          <FormGroup label="Gramas usadas de filamento">
            <input className="input" type="number" step="0.1" value={finalizarForm.gramasUsadas}
              onChange={e => setFinalizarForm(f => ({ ...f, gramasUsadas: e.target.value }))}
              placeholder="Ex: 42.3" />
          </FormGroup>
          <FormGroup label="Observações">
            <textarea className="input min-h-[64px] resize-y" value={finalizarForm.observacao}
              onChange={e => setFinalizarForm(f => ({ ...f, observacao: e.target.value }))}
              placeholder="Como foi a impressão?" />
          </FormGroup>
          <button className="btn-primary w-full mt-1" onClick={finalizar} disabled={saving}>
            {saving ? 'Finalizando...' : 'Finalizar e registrar impressão'}
          </button>
        </Modal>
      )}

      {confirmar && (
        <ModalConfirm
          titulo="Remover impressora"
          mensagem={`Tem certeza que deseja remover "${confirmar.nome}"?`}
          onConfirmar={confirmarDeletar}
          onCancelar={() => setConfirmar(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}