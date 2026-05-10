import { useState } from 'react'
import { Modal, Spinner, Empty, FormGroup, Toast, StatCard } from '../components/common'
import { vendaService } from '../services/vendaService'
import { membroService } from '../services/membroService'
import { fmtData, fmtMoeda } from '../utils/formatters'
import { gerarRelatorioGeral, gerarExtratoMembro } from '../utils/gerarPdf'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'

const FORM = { membroId: '', produtoNome: '', quantidade: 1, valorTotal: '', dataVenda: '' }

export default function Financeiro() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN'

  const { data: vendas,  loading: lV, refetch: rV } = useFetch(() => vendaService.listar())
  const { data: resumo,  loading: lR, refetch: rR } = useFetch(() => vendaService.resumoGeral())
  const { data: membros }                            = useFetch(() => membroService.listar('ATIVO'))
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(FORM)
  const [saving, setSaving]   = useState(false)
  const [gerando, setGerando] = useState(false)
  const [toast, setToast]     = useState(null)

  const totalVendido = vendas?.reduce((s, v) => s + Number(v.valorTotal), 0) ?? 0
  const totalRepasse = vendas?.reduce((s, v) => s + Number(v.repasse), 0) ?? 0
  const totalPago    = vendas?.filter(v => v.statusRepasse === 'PAGO')
                              .reduce((s, v) => s + Number(v.repasse), 0) ?? 0

  const salvar = async () => {
    if (!form.membroId || !form.produtoNome || !form.valorTotal) return
    setSaving(true)
    try {
      await vendaService.criar(form)
      setToast({ msg: 'Venda registrada!', type: 'success' })
      setModal(false); rV(); rR()
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Erro ao salvar', type: 'error' })
    } finally { setSaving(false) }
  }

  const toggleStatus = async (venda) => {
    const novoStatus = venda.statusRepasse === 'PAGO' ? 'PENDENTE' : 'PAGO'
    try {
      await vendaService.atualizarStatus(venda.id, novoStatus)
      rV(); rR()
      setToast({ msg: 'Status atualizado!', type: 'success' })
    } catch { setToast({ msg: 'Erro ao atualizar.', type: 'error' }) }
  }

  const handlePdfGeral = async () => {
    setGerando(true)
    try {
      const [vendasRes, resumoRes] = await Promise.all([
        vendaService.listar(),
        vendaService.resumoGeral(),
      ])
      gerarRelatorioGeral(resumoRes.data, vendasRes.data)
    } catch {
      setToast({ msg: 'Erro ao gerar PDF.', type: 'error' })
    } finally { setGerando(false) }
  }

  const handlePdfMembro = async (r) => {
    setGerando(true)
    try {
      const [vendasRes, membroRes] = await Promise.all([
        vendaService.listar(),
        membroService.buscar(r.membroId),
      ])
      const vendasMembro = vendasRes.data.filter(v => v.membroId === r.membroId)
      gerarExtratoMembro(membroRes.data, vendasMembro, r)
    } catch {
      setToast({ msg: 'Erro ao gerar PDF.', type: 'error' })
    } finally { setGerando(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const repasse = (Number(form.valorTotal) || 0) * 0.70

  if (lV || lR) return <Spinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Financeiro</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button className="btn-ghost text-xs px-3 py-1.5" onClick={handlePdfGeral} disabled={gerando}>
                {gerando ? 'Gerando...' : '↓ PDF Geral'}
              </button>
              <button className="btn-primary" onClick={() => { setForm(FORM); setModal(true) }}>
                + Registrar venda
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-5">
        {isAdmin ? 'Vendas e repasses por produtor (70%)' : 'Seu extrato financeiro'}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total vendido" value={fmtMoeda(totalVendido)} color="text-success" />
        <StatCard label="A repassar"    value={fmtMoeda(totalRepasse)} color="text-warning" />
        <StatCard label="Já repassado"  value={fmtMoeda(totalPago)}    color="text-accent"  />
      </div>

      {isAdmin && resumo?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-sm mb-4">Resumo por membro</h3>
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Membro</th>
                <th className="th">Total vendas</th>
                <th className="th hidden sm:table-cell">A repassar</th>
                <th className="th hidden md:table-cell">Já pago</th>
                <th className="th">Pendente</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {resumo.map(r => (
                <tr key={r.membroId}>
                  <td className="td font-medium">{r.membroNome}</td>
                  <td className="td font-mono text-gray-400 text-xs">{fmtMoeda(r.totalVendas)}</td>
                  <td className="td font-mono text-warning text-xs hidden sm:table-cell">{fmtMoeda(r.totalRepasse)}</td>
                  <td className="td font-mono text-success text-xs hidden md:table-cell">{fmtMoeda(r.totalPago)}</td>
                  <td className="td font-mono text-danger text-xs">{fmtMoeda(r.totalPendente)}</td>
                  <td className="td">
                    <button className="btn-ghost text-xs px-2 py-1" onClick={() => handlePdfMembro(r)} disabled={gerando}>
                      ↓ PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-sm">
          {isAdmin ? 'Todas as vendas' : 'Minhas vendas'}
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {isAdmin && <th className="th">Membro</th>}
              <th className="th hidden sm:table-cell">Produto</th>
              <th className="th">Valor</th>
              <th className="th">Repasse</th>
              <th className="th hidden md:table-cell">Data</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendas?.length === 0 && <tr><td colSpan={6}><Empty /></td></tr>}
            {vendas?.map(v => (
              <tr key={v.id}>
                {isAdmin && <td className="td font-medium">{v.membroNome}</td>}
                <td className="td hidden sm:table-cell">{v.produtoNome}</td>
                <td className="td font-mono text-xs">{fmtMoeda(v.valorTotal)}</td>
                <td className="td font-mono text-warning text-xs">{fmtMoeda(v.repasse)}</td>
                <td className="td text-gray-400 hidden md:table-cell">{fmtData(v.dataVenda)}</td>
                <td className="td">
                  <span
                    className={`${isAdmin ? 'cursor-pointer' : ''} select-none ${v.statusRepasse === 'PAGO' ? 'badge-green' : 'badge-amber'}`}
                    onClick={() => isAdmin && toggleStatus(v)}
                    title={isAdmin ? 'Clique para alternar' : ''}
                  >
                    {v.statusRepasse === 'PAGO' ? 'pago' : 'pendente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Registrar venda" onClose={() => setModal(false)}>
          <FormGroup label="Membro produtor *">
            <select className="input" value={form.membroId} onChange={e => set('membroId', e.target.value)}>
              <option value="">Selecione...</option>
              {membros?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Produto *">
            <input className="input" value={form.produtoNome} onChange={e => set('produtoNome', e.target.value)} placeholder="Produto vendido" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Quantidade">
              <input className="input" type="number" min="1" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} />
            </FormGroup>
            <FormGroup label="Valor total (R$)">
              <input className="input" type="number" step="0.01" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} placeholder="0,00" />
            </FormGroup>
          </div>
          <FormGroup label="Data da venda">
            <input className="input" type="date" value={form.dataVenda} onChange={e => set('dataVenda', e.target.value)} />
          </FormGroup>
          <div className="bg-bg3 border border-border rounded-lg px-4 py-3 text-sm mb-4">
            <span className="text-gray-400">Repasse ao produtor (70%): </span>
            <span className="text-warning font-mono font-medium">{fmtMoeda(repasse)}</span>
          </div>
          <button className="btn-primary w-full" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar venda'}
          </button>
        </Modal>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}