import { useState } from 'react'
import { Modal, ModalConfirm, Spinner, Empty, FormGroup, Toast } from '../components/common'
import { impressaoService } from '../services/impressaoService'
import { membroService } from '../services/membroService'
import { produtoService } from '../services/produtoService'
import { fmtData, fmtMoeda } from '../utils/formatters'
import useFetch from '../hooks/useFetch'

const FORM = { membroId: '', produtoNome: '', quantidade: 1, tempoImpressao: '', dataImpressao: '', observacao: '' }

export default function Impressoes() {
  const [aba, setAba] = useState('impressoes')

  const { data: impressoes, loading: lI, refetch } = useFetch(() => impressaoService.listar())
  const { data: membros }                           = useFetch(() => membroService.listar('ATIVO'))
  const { data: produtos, loading: lC }             = useFetch(() => produtoService.listar())

  const [modal, setModal]     = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando, setEdit]   = useState(null)
  const [form, setForm]       = useState(FORM)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)

  const abrirEditar = (i) => {
    setEdit(i)
    setForm({
      membroId: i.membroId, produtoNome: i.produtoNome,
      quantidade: i.quantidade, tempoImpressao: i.tempoImpressao || '',
      dataImpressao: i.dataImpressao || '', observacao: i.observacao || '',
    })
    setModal(true)
  }

  const selecionarProduto = (nomeProduto) => {
    setEdit(null)
    setForm({ ...FORM, produtoNome: nomeProduto })
    setAba('impressoes')
    setModal(true)
    setToast({ msg: `"${nomeProduto}" selecionado!`, type: 'info' })
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

  const confirmarDeletar = async () => {
    try {
      await impressaoService.deletar(confirmar.id)
      refetch()
      setToast({ msg: 'Registro removido.', type: 'info' })
    } catch {
      setToast({ msg: 'Erro ao remover.', type: 'error' })
    } finally { setConfirmar(null) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Impressões</h2>
      </div>

      <div className="flex gap-1 mb-5 bg-bg2 border border-border rounded-xl p-1 w-fit">
        <button onClick={() => setAba('impressoes')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${aba === 'impressoes' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>
          Impressões
        </button>
        <button onClick={() => setAba('catalogo')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${aba === 'catalogo' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>
          Catálogo
        </button>
      </div>

      {aba === 'impressoes' && (
        <>
          <p className="text-gray-500 text-sm mb-4">O que foi produzido, por quem e quando</p>
          {lI ? <Spinner /> : (
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
                  {impressoes?.length === 0 && <tr><td colSpan={6}><Empty text="Nenhuma impressão ainda — vá ao Catálogo para registrar" /></td></tr>}
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
                          <button className="btn-danger" onClick={() => setConfirmar({ id: i.id, nome: i.produtoNome })}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {aba === 'catalogo' && (
        <>
          <p className="text-gray-500 text-sm mb-4">Clique em um produto para registrar uma impressão com ele</p>
          {lC ? <Spinner /> : produtos?.length === 0
            ? <Empty text="Nenhum produto no catálogo ainda" />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtos?.map(p => (
                  <div key={p.id}
                    className="card p-0 overflow-hidden hover:border-accent transition-colors cursor-pointer group"
                    onClick={() => selecionarProduto(p.nome)}>
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
        </>
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

      {confirmar && (
        <ModalConfirm
          titulo="Remover impressão"
          mensagem={`Tem certeza que deseja remover o registro de "${confirmar.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={confirmarDeletar}
          onCancelar={() => setConfirmar(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}