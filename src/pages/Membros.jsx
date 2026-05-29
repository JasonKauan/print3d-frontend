import { useState } from 'react'
import { Modal, ModalConfirm, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { membroService } from '../services/membroService'
import { configuracaoService } from '../services/configuracaoService'
import { fmtData } from '../utils/formatters'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'

const FORM_INICIAL = { nome: '', email: '', senha: '', role: 'MEMBRO', status: 'ATIVO', dataEntrada: '', dataSaida: '' }

export default function Membros() {
  const { usuario } = useAuthStore()
  const { data: membros, loading, refetch } = useFetch(() => membroService.listar())
  const [modal, setModal]         = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando, setEdit]       = useState(null)
  const [form, setForm]           = useState(FORM_INICIAL)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState(null)

  // Override de repasse por membro
  const [modalRepasse, setModalRepasse] = useState(null) // { id, nome, percentual }
  const [savingRepasse, setSavingRepasse] = useState(false)

  const abrirRepasse = (m) => setModalRepasse({ id: m.id, nome: m.nome, percentual: '' })

  const salvarRepasse = async () => {
    const pct = parseFloat(modalRepasse.percentual)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setToast({ msg: 'Percentual deve ser entre 0 e 100.', type: 'error' }); return
    }
    setSavingRepasse(true)
    try {
      await configuracaoService.atualizarRepasseMembro(modalRepasse.id, pct)
      setToast({ msg: `Repasse de ${modalRepasse.nome} definido em ${pct}%!`, type: 'success' })
      setModalRepasse(null)
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar repasse.', type: 'error' })
    } finally { setSavingRepasse(false) }
  }

  const removerRepasse = async () => {
    setSavingRepasse(true)
    try {
      await configuracaoService.removerRepasseMembro(modalRepasse.id)
      setToast({ msg: 'Repasse personalizado removido. Voltando ao padrão global.', type: 'info' })
      setModalRepasse(null)
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao remover repasse.', type: 'error' })
    } finally { setSavingRepasse(false) }
  }

  const abrirCriar = () => { setEdit(null); setForm(FORM_INICIAL); setModal(true) }
  const abrirEditar = (m) => {
    setEdit(m)
    setForm({ nome: m.nome || '', email: m.email || '', senha: '', role: m.role || 'MEMBRO',
      status: m.status || 'ATIVO', dataEntrada: m.dataEntrada || '', dataSaida: m.dataSaida || '' })
    setModal(true)
  }

  const salvar = async () => {
    if (!form.nome || form.nome.trim() === '') { setToast({ msg: 'Nome é obrigatório.', type: 'error' }); return }
    if (!editando && (!form.senha || form.senha.length < 6)) { setToast({ msg: 'Senha deve ter no mínimo 6 caracteres.', type: 'error' }); return }
    setSaving(true)
    try {
      const payload = { nome: form.nome.trim(), email: form.email, role: form.role, status: form.status,
        dataEntrada: form.dataEntrada || null, dataSaida: form.dataSaida || null }
      if (form.senha && form.senha.trim() !== '') payload.senha = form.senha
      if (editando) {
        await membroService.atualizar(editando.id, payload)
        setToast({ msg: 'Membro atualizado!', type: 'success' })
      } else {
        payload.senha = form.senha
        await membroService.criar(payload)
        setToast({ msg: 'Membro cadastrado!', type: 'success' })
      }
      setModal(false); refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar.', type: 'error' })
    } finally { setSaving(false) }
  }

  const confirmarDeletar = async () => {
    try {
      await membroService.deletar(confirmar.id)
      setToast({ msg: 'Membro removido.', type: 'info' })
      refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao remover.', type: 'error' })
    } finally { setConfirmar(null) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Membros</h2>
        <button className="btn-primary" onClick={abrirCriar}>+ Novo membro</button>
      </div>
      <p className="text-gray-500 text-sm mb-5">Gerencie quem faz parte da entidade</p>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Membro</th>
                <th className="th hidden sm:table-cell">Email</th>
                <th className="th">Status</th>
                <th className="th hidden md:table-cell">Entrada</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {membros?.length === 0 && <tr><td colSpan={5}><Empty /></td></tr>}
              {membros?.map(m => (
                <tr key={m.id}>
                  {/* Nome + foto */}
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg3 border border-border relative overflow-hidden flex items-center justify-center shrink-0">
                        {m.fotoUrl
                          ? <img src={m.fotoUrl} alt={m.nome}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none' }} />
                          : <span className="text-xs text-gray-500 font-medium">
                              {m.nome?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        }
                      </div>
                      <span className="font-medium">{m.nome}</span>
                    </div>
                  </td>
                  <td className="td text-gray-400 hidden sm:table-cell">{m.email || '—'}</td>
                  <td className="td">
                    <span className={m.status === 'ATIVO' ? 'badge-green' : 'badge-red'}>
                      {m.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="td text-gray-400 hidden md:table-cell">{fmtData(m.dataEntrada)}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button className="btn-ghost text-xs px-2 py-1" onClick={() => abrirEditar(m)}>Editar</button>
                      <button className="btn-ghost text-xs px-2 py-1 text-accent" title="Repasse personalizado" onClick={() => abrirRepasse(m)}>%</button>
                      <button className="btn-danger" onClick={() => setConfirmar({ id: m.id, nome: m.nome })}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={editando ? 'Editar membro' : 'Novo membro'} onClose={() => setModal(false)}>
          <FormGroup label="Nome *">
            <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
          </FormGroup>
          <FormGroup label="Email">
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
          </FormGroup>
          <FormGroup label={editando ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}>
            <input className="input" type="password" value={form.senha} onChange={e => set('senha', e.target.value)}
              placeholder={editando ? 'Deixe vazio para manter a atual' : 'Mínimo 6 caracteres'} required={!editando} />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Role">
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="MEMBRO">Membro</option>
                <option value="ADMIN">Admin</option>
                {usuario?.role === 'DEV' && <option value="DEV">Dev</option>}
              </select>
            </FormGroup>
            <FormGroup label="Status">
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Data de entrada">
              <input className="input" type="date" value={form.dataEntrada} onChange={e => set('dataEntrada', e.target.value)} />
            </FormGroup>
            <FormGroup label="Data de saída">
              <input className="input" type="date" value={form.dataSaida} onChange={e => set('dataSaida', e.target.value)} />
            </FormGroup>
          </div>
          <button className="btn-primary w-full mt-2" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar membro'}
          </button>
        </Modal>
      )}

      {confirmar && (
        <ModalConfirm
          titulo="Remover membro"
          mensagem={`Tem certeza que deseja remover "${confirmar.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={confirmarDeletar}
          onCancelar={() => setConfirmar(null)}
        />
      )}

      {/* Modal override de repasse */}
      {modalRepasse && (
        <Modal title={`Repasse — ${modalRepasse.nome}`} onClose={() => setModalRepasse(null)}>
          <p className="text-gray-400 text-sm mb-4">
            Define um percentual de repasse individual para este membro. Deixe vazio e remova para voltar ao padrão global.
          </p>
          <FormGroup label="Percentual de repasse (%)">
            <input className="input" type="number" min="0" max="100" step="0.1"
              value={modalRepasse.percentual}
              onChange={e => setModalRepasse(r => ({ ...r, percentual: e.target.value }))}
              placeholder="Ex: 65" />
          </FormGroup>
          <div className="flex gap-3 mt-2">
            <button className="btn-ghost flex-1 text-sm" onClick={removerRepasse} disabled={savingRepasse}>
              Remover override
            </button>
            <button className="btn-primary flex-1" onClick={salvarRepasse} disabled={savingRepasse}>
              {savingRepasse ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}