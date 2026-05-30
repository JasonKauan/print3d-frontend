import { useState, useRef, useEffect } from 'react'
import { Modal, ModalConfirm, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { produtoService } from '../services/produtoService'
import { fmtMoeda } from '../utils/formatters'
import useFetch from '../hooks/useFetch'
import QRCode from 'qrcode'

const FORM = { nome: '', descricao: '', preco: '', estoque: '', categoria: '', foto: null }

export default function Catalogo() {
  const { data: produtos, loading, refetch } = useFetch(() => produtoService.listar())
  const { data: stats } = useFetch(() => produtoService.stats())
  const [modal, setModal]     = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando, setEdit]   = useState(null)
  const [form, setForm]       = useState(FORM)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)
  const fotoRef               = useRef()

  // QR Code
  const [modalQr, setModalQr]   = useState(null) // produto
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    if (!modalQr) return
    const url = `${window.location.origin}/publico?produto=${modalQr.id}`
    QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#ffffff', light: '#1a1f2e' } })
      .then(setQrDataUrl)
  }, [modalQr])

  const baixarQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${modalQr.nome.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  const abrirCriar = () => { setEdit(null); setForm(FORM); setPreview(null); setModal(true) }
  const abrirEditar = (p) => {
    setEdit(p)
    setForm({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, estoque: p.estoque, categoria: p.categoria || '', foto: null })
    setPreview(p.fotoUrl || null)
    setModal(true)
  }

  // Edição inline de categoria
  const [editCategoria, setEditCategoria] = useState(null) // { id, valor }
  const salvarCategoria = async () => {
    try {
      await produtoService.atualizarCategoria(editCategoria.id, editCategoria.valor)
      setEditCategoria(null)
      refetch()
    } catch {
      setToast({ msg: 'Erro ao salvar categoria.', type: 'error' })
    }
  }

  // Filtro por categoria
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const categorias = ['Todas', ...new Set((produtos ?? []).map(p => p.categoria || 'Sem categoria'))]
  const produtosFiltrados = filtroCategoria === 'Todas'
    ? (produtos ?? [])
    : (produtos ?? []).filter(p => (p.categoria || 'Sem categoria') === filtroCategoria)

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
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao remover.', type: 'error' })
    } finally { setConfirmar(null) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Catálogo</h2>
        <button className="btn-primary" onClick={abrirCriar}>+ Produto</button>
      </div>
      <p className="text-gray-500 text-sm mb-4">Todos os produtos com estoque e valor</p>

      {/* Filtro por categoria */}
      {categorias.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {categorias.map(cat => (
            <button key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                filtroCategoria === cat
                  ? 'bg-accent text-white border-accent'
                  : 'text-gray-400 border-border hover:text-white hover:border-accent'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : produtosFiltrados.length === 0
        ? <Empty text="Nenhum produto no catálogo ainda" />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtosFiltrados.map(p => {
              const s = stats?.[p.nome]
              return (
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
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold">{p.nome}</p>
                    {/* Categoria com edição inline */}
                    {editCategoria?.id === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          className="input text-xs py-0.5 px-2 h-6 w-24"
                          value={editCategoria.valor}
                          onChange={e => setEditCategoria(c => ({ ...c, valor: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') salvarCategoria(); if (e.key === 'Escape') setEditCategoria(null) }}
                          placeholder="Categoria"
                        />
                        <button onClick={salvarCategoria} className="text-success text-sm">✓</button>
                        <button onClick={() => setEditCategoria(null)} className="text-danger text-sm">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditCategoria({ id: p.id, valor: p.categoria || '' })}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-accent transition-colors shrink-0"
                        title="Editar categoria">
                        <span className={`${p.categoria ? 'badge-blue' : 'text-gray-600'} text-[10px]`}>
                          {p.categoria || 'Sem categoria'}
                        </span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536M9 11l6.586-6.586a2 2 0 112.828 2.828L11.828 13.828A2 2 0 0110 14.414V16h1.586a2 2 0 001.414-.586l.172-.172" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">{p.descricao || ''}</p>
                  {/* Stats de consumo */}
                  {s && Number(s.totalGramas) > 0 && (
                    <div className="grid grid-cols-3 gap-1 mt-2 mb-1">
                      <div className="bg-bg3 rounded-lg p-1.5 text-center">
                        <p className="text-[10px] text-gray-500">Impressões</p>
                        <p className="text-xs font-mono font-medium">{s.totalImpressoes}</p>
                      </div>
                      <div className="bg-bg3 rounded-lg p-1.5 text-center">
                        <p className="text-[10px] text-gray-500">Gramas</p>
                        <p className="text-xs font-mono font-medium text-warning">{Number(s.totalGramas).toFixed(0)}g</p>
                      </div>
                      <div className="bg-bg3 rounded-lg p-1.5 text-center">
                        <p className="text-[10px] text-gray-500">Custo fil.</p>
                        <p className="text-xs font-mono font-medium text-warning">{fmtMoeda(s.totalCustoFilamento)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-accent font-mono text-sm">{fmtMoeda(p.preco)}</span>
                    <span className="text-gray-500 text-xs">{p.estoque} em estoque</span>
                  </div>
                  <div className="border-t border-border mt-3 pt-3 flex gap-2">
                    <button className="btn-ghost text-xs flex-1" onClick={() => abrirEditar(p)}>Editar</button>
                    <button className="btn-ghost text-xs px-2" title="QR Code"
                      onClick={() => { setModalQr(p); setQrDataUrl(null) }}>⬛ QR</button>
                    <button className="btn-danger" onClick={() => deletar(p)}>✕</button>
                  </div>
                </div>
              </div>
              )
            })}
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
          <FormGroup label="Categoria">
            <input className="input" value={form.categoria} onChange={e => set('categoria', e.target.value)}
              placeholder="Ex: Miniaturas, Peças técnicas, Decoração..." />
          </FormGroup>
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

      {/* Modal QR Code */}
      {modalQr && (
        <Modal title={`QR Code — ${modalQr.nome}`} onClose={() => setModalQr(null)}>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR Code" className="rounded-xl w-48 h-48" />
              : <div className="w-48 h-48 bg-bg3 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
                </div>
            }
            <p className="text-xs text-gray-500 text-center px-4">
              Aponta para a vitrine pública do produto.<br />
              Ideal para etiquetas e embalagens.
            </p>
            <button className="btn-primary w-full" onClick={baixarQr} disabled={!qrDataUrl}>
              ⬇ Baixar PNG
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}