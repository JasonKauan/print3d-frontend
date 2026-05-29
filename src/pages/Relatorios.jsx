import { useState } from 'react'
import { Spinner, Toast } from '../components/common'
import { gerarRelatorioExcel } from '../utils/gerarExcel'
import api from '../services/api'

export default function Relatorios() {
  const [gerando, setGerando] = useState(false)
  const [toast, setToast]     = useState(null)

  const exportarExcel = async () => {
    setGerando(true)
    try {
      const [vendas, impressoes, movimentacoes, filamentos] = await Promise.all([
        api.get('/vendas').then(r => r.data),
        api.get('/impressoes').then(r => r.data),
        api.get('/estoque').then(r => r.data),
        api.get('/filamentos').then(r => r.data),
      ])
      gerarRelatorioExcel({ vendas, impressoes, movimentacoes, filamentos })
      setToast({ msg: 'Relatório exportado!', type: 'success' })
    } catch {
      setToast({ msg: 'Erro ao gerar relatório.', type: 'error' })
    } finally { setGerando(false) }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-1">Relatórios</h2>
      <p className="text-gray-500 text-sm mb-6">Exporte os dados do sistema em diferentes formatos</p>

      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 border border-success flex items-center justify-center shrink-0 text-xl">
            📊
          </div>
          <div className="flex-1">
            <p className="font-semibold mb-1">Relatório completo — Excel</p>
            <p className="text-gray-400 text-sm mb-4">
              Exporta todos os dados em um único arquivo <code className="text-accent">.xlsx</code> com 4 abas:
              Vendas, Impressões, Estoque e Filamentos.
            </p>
            <button
              className="btn-primary"
              onClick={exportarExcel}
              disabled={gerando}
            >
              {gerando ? 'Gerando...' : '↓ Exportar Excel'}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}