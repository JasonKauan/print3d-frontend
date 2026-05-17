import { useState, useRef, useEffect } from 'react'
import { Toast, FormGroup } from '../components/common'
import useAuthStore from '../store/useAuthStore'
import { gerarExtratoMembro } from '../utils/gerarPdf'
import api from '../services/api'

export default function Perfil() {
  const { usuario } = useAuthStore()
  const [perfil, setPerfil]       = useState(null)
  const [form, setForm]           = useState({ senhaAtual: '', novaSenha: '', confirmar: '' })
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [gerando, setGerando]     = useState(false)
  const [toast, setToast]         = useState(null)
  const fotoRef                   = useRef()

  useEffect(() => {
    api.get('/membros/me').then(r => setPerfil(r.data)).catch(() => {})
  }, [])

  const handleFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('foto', file)
      const { data } = await api.patch('/membros/minha-foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPerfil(data)
      setToast({ msg: 'Foto atualizada!', type: 'success' })
    } catch {
      setToast({ msg: 'Erro ao atualizar foto.', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const salvarSenha = async () => {
    if (form.novaSenha !== form.confirmar) {
      setToast({ msg: 'Nova senha e confirmação não coincidem.', type: 'error' })
      return
    }
    if (form.novaSenha.length < 6) {
      setToast({ msg: 'Nova senha deve ter no mínimo 6 caracteres.', type: 'error' })
      return
    }
    setSaving(true)
    try {
      await api.patch('/membros/minha-senha', {
        senhaAtual: form.senhaAtual,
        novaSenha:  form.novaSenha,
      })
      setToast({ msg: 'Senha atualizada com sucesso!', type: 'success' })
      setForm({ senhaAtual: '', novaSenha: '', confirmar: '' })
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Senha atual incorreta.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleExtratoPdf = async () => {
    setGerando(true)
    try {
      const [vendasRes, resumoRes] = await Promise.all([
        api.get('/vendas'),
        api.get('/vendas/resumo'),
      ])
      const resumo = Array.isArray(resumoRes.data) ? resumoRes.data[0] : resumoRes.data
      gerarExtratoMembro(perfil || usuario, vendasRes.data, resumo)
    } catch {
      setToast({ msg: 'Erro ao gerar extrato.', type: 'error' })
    } finally { setGerando(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-1">Meu perfil</h2>
      <p className="text-gray-500 text-sm mb-5">Gerencie suas informações</p>

      {/* Foto de perfil */}
      <div className="card mb-4 flex items-center gap-5">
        <div className="relative shrink-0">
          {/* Container circular com position relative para o absolute inset-0 funcionar */}
          <div className="w-20 h-20 rounded-full bg-bg3 border-2 border-border relative overflow-hidden flex items-center justify-center">
            {perfil?.fotoUrl
              ? <img
                  src={perfil.fotoUrl}
                  alt="Foto de perfil"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              : <span className="text-3xl text-gray-600">
                  {usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
                </span>
            }
          </div>

          {/* Spinner de upload sobre o avatar */}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div>
          <p className="font-medium text-sm mb-1">{usuario?.nome}</p>
          <p className="text-gray-500 text-xs mb-3">{usuario?.email}</p>
          <button
            className="btn-ghost text-xs px-3 py-1.5"
            onClick={() => fotoRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : perfil?.fotoUrl ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          <input
            ref={fotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFoto}
          />
        </div>
      </div>

      {/* Informações */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Informações</p>
          <button
            className="btn-ghost text-xs px-3 py-1.5"
            onClick={handleExtratoPdf}
            disabled={gerando}
          >
            {gerando ? 'Gerando...' : '↓ Meu extrato PDF'}
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Nome</span>
            <span className="text-sm font-medium">{usuario?.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Email</span>
            <span className="text-sm font-medium">{usuario?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Perfil</span>
            <span className={`badge ${usuario?.role === 'ADMIN' ? 'badge-blue' : 'badge-green'}`}>
              {usuario?.role?.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Trocar senha */}
      <div className="card">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Trocar senha</p>
        <FormGroup label="Senha atual">
          <input className="input" type="password" value={form.senhaAtual}
            onChange={e => set('senhaAtual', e.target.value)} placeholder="••••••••" />
        </FormGroup>
        <FormGroup label="Nova senha">
          <input className="input" type="password" value={form.novaSenha}
            onChange={e => set('novaSenha', e.target.value)} placeholder="Mínimo 6 caracteres" />
        </FormGroup>
        <FormGroup label="Confirmar nova senha">
          <input className="input" type="password" value={form.confirmar}
            onChange={e => set('confirmar', e.target.value)} placeholder="Repita a nova senha" />
        </FormGroup>
        <button className="btn-primary w-full mt-1" onClick={salvarSenha} disabled={saving}>
          {saving ? 'Salvando...' : 'Atualizar senha'}
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}