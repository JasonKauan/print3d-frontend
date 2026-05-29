import { useState } from 'react'
import { Spinner, Toast, FormGroup, StatCard } from '../components/common'
import { producaoService, configuracaoService } from '../services/configuracaoService'
import { filamentoService } from '../services/filamentoService'
import { fmtMoeda } from '../utils/formatters'
import useAuthStore from '../store/useAuthStore'
import useFetch from '../hooks/useFetch'

export default function Producao() {
  const { usuario } = useAuthStore()
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'DEV'

  const { data: filamentos }    = useFetch(() => filamentoService.listarDisponiveis())
  const { data: configs, refetch: refetchConfigs } = useFetch(() => configuracaoService.listar())

  const [form, setForm] = useState({ filamentoId: '', gramas: '' })
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState(null)

  // Configurações editáveis (só admin)
  const [editandoConfigs, setEditandoConfigs] = useState(false)
  const [configForm, setConfigForm] = useState({ PERCENTUAL_REPASSE: '', MULTIPLICADOR_INTERNO: '', MULTIPLICADOR_EXTERNO: '' })
  const [savingConfig, setSavingConfig] = useState(false)

  const calcular = async () => {
    if (!form.filamentoId || !form.gramas) return
    setLoading(true)
    setResultado(null)
    try {
      const { data } = await producaoService.calcular(form.filamentoId, form.gramas)
      setResultado(data)
    } catch (e) {
      setToast({ msg: e.response?.data?.erro || 'Erro ao calcular.', type: 'error' })
    } finally { setLoading(false) }
  }

  const abrirEdicaoConfigs = () => {
    setConfigForm({
      PERCENTUAL_REPASSE:    configs?.PERCENTUAL_REPASSE    || '70',
      MULTIPLICADOR_INTERNO: configs?.MULTIPLICADOR_INTERNO || '1.5',
      MULTIPLICADOR_EXTERNO: configs?.MULTIPLICADOR_EXTERNO || '2.5',
    })
    setEditandoConfigs(true)
  }

  const salvarConfigs = async () => {
    setSavingConfig(true)
    try {
      await configuracaoService.atualizar(configForm)
      setToast({ msg: 'Configurações salvas!', type: 'success' })
      setEditandoConfigs(false)
      refetchConfigs()
    } catch (e) {
      setToast({ msg: e.response?.data?.erro || 'Erro ao salvar.', type: 'error' })
    } finally { setSavingConfig(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold">Calculadora de Produção</h2>
        {isAdmin && (
          <button className="btn-ghost text-xs" onClick={abrirEdicaoConfigs}>
            ⚙ Configurações
          </button>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Calcule o custo real de produção e os preços sugeridos com base no filamento
      </p>

      {/* Configs atuais */}
      {configs && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Repasse global</p>
            <p className="text-xl font-mono font-semibold text-accent">{configs.PERCENTUAL_REPASSE}%</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Mult. interno</p>
            <p className="text-xl font-mono font-semibold text-success">{configs.MULTIPLICADOR_INTERNO}x</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Mult. externo</p>
            <p className="text-xl font-mono font-semibold text-warning">{configs.MULTIPLICADOR_EXTERNO}x</p>
          </div>
        </div>
      )}

      {/* Formulário de cálculo */}
      <div className="card mb-6">
        <h3 className="font-medium text-sm mb-4">Dados da produção</h3>
        <FormGroup label="Filamento *">
          <select className="input" value={form.filamentoId} onChange={e => set('filamentoId', e.target.value)}>
            <option value="">Selecione um filamento...</option>
            {filamentos?.map(f => (
              <option key={f.id} value={f.id}>
                {f.nome} {f.cor ? `— ${f.cor}` : ''} (R$ {Number(f.custoPorGrama).toFixed(4)}/g)
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Peso usado (gramas) *">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0.1"
            value={form.gramas}
            onChange={e => set('gramas', e.target.value)}
            placeholder="Ex: 45.5"
          />
        </FormGroup>
        <button
          className="btn-primary w-full mt-2"
          onClick={calcular}
          disabled={loading || !form.filamentoId || !form.gramas}
        >
          {loading ? 'Calculando...' : 'Calcular custo'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <p className="font-semibold">{resultado.filamentoNome}</p>
              {resultado.filamentoCor && <p className="text-xs text-gray-500">{resultado.filamentoCor}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{resultado.gramasUsadas}g usadas</p>
              <p className="text-xs text-gray-500">R$ {Number(resultado.custoPorGrama).toFixed(4)}/g</p>
            </div>
          </div>

          {/* Custo de produção */}
          <div className="bg-bg3 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Custo de produção</p>
            <p className="text-3xl font-mono font-bold text-white">{fmtMoeda(resultado.custoFilamento)}</p>
          </div>

          {/* Preços sugeridos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 border border-success rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">
                Preço interno ({resultado.multiplicadorInterno}x)
              </p>
              <p className="text-xl font-mono font-bold text-success">{fmtMoeda(resultado.precoSugeridoInterno)}</p>
              <p className="text-xs text-gray-500 mt-1">Lucro: {fmtMoeda(resultado.lucroInterno)}</p>
            </div>
            <div className="bg-warning/10 border border-warning rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">
                Preço externo ({resultado.multiplicadorExterno}x)
              </p>
              <p className="text-xl font-mono font-bold text-warning">{fmtMoeda(resultado.precoSugeridoExterno)}</p>
              <p className="text-xs text-gray-500 mt-1">Lucro: {fmtMoeda(resultado.lucroExterno)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Os preços sugeridos são baseados nos multiplicadores configurados pelo admin
          </p>
        </div>
      )}

      {/* Modal de configurações (admin) */}
      {editandoConfigs && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setEditandoConfigs(false) }}>
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-base mb-1">Configurações globais</h3>
            <p className="text-gray-500 text-xs mb-4">Afeta todos os membros sem override personalizado</p>

            <FormGroup label="Repasse global (%)">
              <input className="input" type="number" step="1" min="0" max="100"
                value={configForm.PERCENTUAL_REPASSE}
                onChange={e => setConfigForm(f => ({ ...f, PERCENTUAL_REPASSE: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Multiplicador interno (ex: 1.5 = 150% do custo)">
              <input className="input" type="number" step="0.1" min="1"
                value={configForm.MULTIPLICADOR_INTERNO}
                onChange={e => setConfigForm(f => ({ ...f, MULTIPLICADOR_INTERNO: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Multiplicador externo (ex: 2.5 = 250% do custo)">
              <input className="input" type="number" step="0.1" min="1"
                value={configForm.MULTIPLICADOR_EXTERNO}
                onChange={e => setConfigForm(f => ({ ...f, MULTIPLICADOR_EXTERNO: e.target.value }))} />
            </FormGroup>

            <div className="flex gap-3 mt-2">
              <button className="btn-ghost flex-1" onClick={() => setEditandoConfigs(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={salvarConfigs} disabled={savingConfig}>
                {savingConfig ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}