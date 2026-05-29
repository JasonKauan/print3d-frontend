import { useState } from 'react'
import { Modal, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { impressaoService } from '../services/impressaoService'
import { membroService } from '../services/membroService'
import { produtoService } from '../services/produtoService'
import { fmtMoeda } from '../utils/formatters'
import useFetch from '../hooks/useFetch'

const FORM = { membroId: '', produtoNome: '', quantidade: 1, tempoImpressao: '', dataImpressao: '', observacao: '' }

export default function Impressoes() {
  const { data: membros }               = useFetch(() => membroService.listar('ATIVO'))
  const { data: produtos, loading: lC } = useFetch(() => produtoService.listar())

  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState(null)

  const selecionarProduto = (p) => {
    setForm({ ...FORM, produtoNome: p.nome })
    setModal(true)
  }

  const salvar = async () => {
    if (!form.membroId || !form.produtoNome) return
    setSaving(true)
    try {
      await impressaoService.criar(form)
      setToast({ msg: 'Impressão registrada!', type: 'success' })
      setModal(false)
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar', type: 'error' })
    } finally { setSaving(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Impressões</h2>
      </div>
      <p className="text-gray-500 text-sm mb-5">Clique em um produto para registrar uma impressão</p>

      {lC ? <Spinner /> : produtos?.length === 0
        ? <Empty text="Nenhum produto no catálogo ainda" />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos?.map(p => (
              <div key={p.id}
                className="card p-0 overflow-hidden hover:border-accent transition-colors cursor-pointer group"
                onClick={() => selecionarProduto(p)}>
                <div className="h-36 bg-bg3 relative overflow-hidden">
                  {p.fotoUrl
                    ? <img src={p.fotoUrl} alt={p.nome}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { e.target.style.display = 'none' }} />
                    : <div className="flex items-center justify-center h-full text-gray-600 text-sm">sem foto</div>
                  }
                  <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-accent text-white text-xs px-3 py-1 rounded-full font-medium">
                      + Registrar impressão
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm mb-1">{p.nome}</p>
                  <p className="text-gray-500 text-xs mb-2 line-clamp-1">{p.descricao || ''}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-accent font-mono text-xs">{fmtMoeda(p.preco)}</span>
                    <span className="text-gray-500 text-xs">{p.estoque} em estoque</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <Modal title={`Registrar — ${form.produtoNome}`} onClose={() => setModal(false)}>
          <FormGroup label="Membro *">
            <select className="input" value={form.membroId} onChange={e => set('membroId', e.target.value)}>
              <option value="">Selecione...</option>
              {membros?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
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
            {saving ? 'Salvando...' : 'Registrar impressão'}
          </button>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}