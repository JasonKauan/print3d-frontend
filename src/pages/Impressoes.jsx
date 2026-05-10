import { useState } from 'react'
import { Modal, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { impressaoService } from '../services/impressaoService'
import { membroService } from '../services/membroService'
import { fmtData } from '../utils/formatters'
import useFetch from '../hooks/useFetch'

const FORM = { membroId: '', produtoNome: '', quantidade: 1, tempoImpressao: '', dataImpressao: '', observacao: '' }

export default function Impressoes() {
  const { data: impressoes, loading, refetch } = useFetch(() => impressaoService.listar())
  const { data: membros }                       = useFetch(() => membroService.listar('ATIVO'))
  const [modal, setModal]   = useState(false)
  const [editando, setEdit] = useState(null)
  const [form, setForm]     = useState(FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState(null)

  const abrirCriar = () => { setEdit(null); setForm(FORM); setModal(true) }
  const abrirEditar = (i) => {
    setEdit(i)
    setForm({
      membroId: i.membroId, produtoNome: i.produtoNome,
      quantidade: i.quantidade, tempoImpressao: i.tempoImpressao || '',
      dataImpressao: i.dataImpressao || '', observacao: i.observacao || '',
    })
    setModal(true)
  }

  const salvar = async () => {
    if (!form.membroId || !form.produtoNome) return
    setSaving(true)
    try {
      if (editando) {
        await impressaoService.atualizar(editando.id, form)
        setToast({ msg: 'Registro atualizado!', type: 'success' })
      } else {
        await impressaoService.criar(form)
        setToast({ msg: 'Impressão registrada!', type: 'success' })
      }
      setModal(false); refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar', type: 'error' })
    } finally { setSaving(false) }
  }

  const deletar = async (id) => {
    if (!confirm('Remover registro?')) return
    try { await impressaoService.deletar(id); refetch()
      setToast({ msg: 'Removido.', type: 'info' })
    } catch { setToast({ msg: 'Erro ao remover.', type: 'error' }) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Impressões</h2>
        <button className="btn-primary" onClick={abrirCriar}>+ Registrar</button>
      </div>
      <p className="text-gray-500 text-sm mb-5">O que foi produzido, por quem e quando</p>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Membro</th>
                <th className="th">Produto</th>
                <th className="th hidden sm:table-cell">Qtd</th>
                <th className="th hidden md:table-cell">Tempo</th>
                <th className="th">Data</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {impressoes?.length === 0 && <tr><td colSpan={6}><Empty /></td></tr>}
              {impressoes?.map(i => (
                <tr key={i.id}>
                  <td className="td font-medium">{i.membroNome}</td>
                  <td className="td">{i.produtoNome}</td>
                  <td className="td hidden sm:table-cell">{i.quantidade} unid.</td>
                  <td className="td text-gray-400 font-mono text-xs hidden md:table-cell">{i.tempoImpressao || '—'}</td>
                  <td className="td text-gray-400">{fmtData(i.dataImpressao)}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button className="btn-ghost text-xs px-2 py-1" onClick={() => abrirEditar(i)}>Editar</button>
                      <button className="btn-danger" onClick={() => deletar(i.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={editando ? 'Editar registro' : 'Registrar impressão'} onClose={() => setModal(false)}>
          <FormGroup label="Membro *">
            <select className="input" value={form.membroId} onChange={e => set('membroId', e.target.value)}>
              <option value="">Selecione...</option>
              {membros?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Produto impresso *">
            <input className="input" value={form.produtoNome} onChange={e => set('produtoNome', e.target.value)} placeholder="Nome do produto" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Quantidade">
              <input className="input" type="number" min="1" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} />
            </FormGroup>
            <FormGroup label="Tempo de impressão">
              <input className="input" value={form.tempoImpressao} onChange={e => set('tempoImpressao', e.target.value)} placeholder="ex: 4h30min" />
            </FormGroup>
          </div>
          <FormGroup label="Data">
            <input className="input" type="date" value={form.dataImpressao} onChange={e => set('dataImpressao', e.target.value)} />
          </FormGroup>
          <FormGroup label="Observações">
            <textarea className="input min-h-[72px] resize-y" value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Informações adicionais..." />
          </FormGroup>
          <button className="btn-primary w-full mt-1" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Registrar impressão'}
          </button>
        </Modal>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
