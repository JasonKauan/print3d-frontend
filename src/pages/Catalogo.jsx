import { useState, useRef } from 'react'
import { Modal, ModalConfirm, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { produtoService } from '../services/produtoService'
import { fmtMoeda } from '../utils/formatters'
import useFetch from '../hooks/useFetch'

const FORM = { nome: '', descricao: '', preco: '', estoque: '', foto: null }

export default function Catalogo() {
  const { data: produtos, loading, refetch } = useFetch(() => produtoService.listar())
  const [modal, setModal]     = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando, setEdit]   = useState(null)
  const [form, setForm]       = useState(FORM)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)
  const fotoRef               = useRef()

  const abrirCriar = () => { setEdit(null); setForm(FORM); setPreview(null); setModal(true) }
  const abrirEditar = (p) => {
    setEdit(p)
    setForm({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, estoque: p.estoque, foto: null })
    setPreview(p.fotoUrl || null)
    setModal(true)
  }

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, foto: file }))
    setPreview(URL.createObjectURL(file))
  }

  const salvar = async () => {
    if (!form.nome) return
    setSaving(true)
    try {
      if (editando) {
        await produtoService.atualizar(editando.id, form)
        setToast({ msg: 'Produto atualizado!', type: 'success' })
      } else {
        await produtoService.criar(form)
        setToast({ msg: 'Produto adicionado ao catálogo!', type: 'success' })
      }
      setModal(false); refetch()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar', type: 'error' })
    } finally { setSaving(false) }
  }

  const deletar = (produto) => {
    setConfirmar({ id: produto.id, nome: produto.nome })
  }

  const confirmarDeletar = async () => {
    try {
      await produtoService.deletar(confirmar.id)
      setToast({ msg: 'Produto removido.', type: 'info' })
      refetch()
    } catch {
      setToast({ msg: 'Erro ao remover.', type: 'error' })
    } finally { setConfirmar(null) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Catálogo</h2>
        <button className="btn-primary" onClick={abrirCriar}>+ Produto</button>
      </div>
      <p className="text-gray-500 text-sm mb-5">Todos os produtos com estoque e valor</p>

      {loading ? <Spinner /> : produtos?.length === 0
        ? <Empty text="Nenhum produto no catálogo ainda" />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos?.map(p => (
              <div key={p.id} className="card p-0 overflow-hidden hover:border-accent transition-colors">

                {/* Foto — container com altura fixa e position relative */}
                <div className="h-40 bg-bg3 relative overflow-hidden">
                  {p.fotoUrl
                    ? <img
                        src={p.fotoUrl}
                        alt={p.nome}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    : <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                        sem foto
                      </div>
                  }
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-semibold mb-1">{p.nome}</p>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">{p.descricao || ''}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-accent font-mono text-sm">{fmtMoeda(p.preco)}</span>
                    <span className="text-gray-500 text-xs">{p.estoque} em estoque</span>
                  </div>
                  <div className="border-t border-border mt-3 pt-3 flex gap-2">
                    <button className="btn-ghost text-xs flex-1" onClick={() => abrirEditar(p)}>Editar</button>
                    <button className="btn-danger" onClick={() => deletar(p)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <Modal title={editando ? 'Editar produto' : 'Novo produto'} onClose={() => setModal(false)}>
          <FormGroup label="Nome do produto *">
            <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do produto" />
          </FormGroup>
          <FormGroup label="Descrição">
            <textarea className="input min-h-[64px] resize-y" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descreva o produto..." />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Preço (R$)">
              <input className="input" type="number" step="0.01" value={form.preco} onChange={e => set('preco', e.target.value)} placeholder="0,00" />
            </FormGroup>
            <FormGroup label="Estoque">
              <input className="input" type="number" min="0" value={form.estoque} onChange={e => set('estoque', e.target.value)} placeholder="0" />
            </FormGroup>
          </div>
          <FormGroup label="Foto do produto">
            <div
              className="border-2 border-dashed border-border rounded-lg p-5 text-center text-gray-500 text-sm cursor-pointer hover:border-accent hover:text-accent transition-colors"
              onClick={() => fotoRef.current.click()}
            >
              📷 Clique para tirar foto ou escolher arquivo
            </div>
            <input ref={fotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
            {preview && (
              <div className="relative h-40 mt-3 rounded-lg overflow-hidden">
                <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
              </div>
            )}
          </FormGroup>
          <button className="btn-primary w-full mt-1" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar ao catálogo'}
          </button>
        </Modal>
      )}

      {confirmar && (
        <ModalConfirm
          titulo="Remover produto"
          mensagem={`Deseja remover "${confirmar.nome}" do catálogo?`}
          onConfirmar={confirmarDeletar}
          onCancelar={() => setConfirmar(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}