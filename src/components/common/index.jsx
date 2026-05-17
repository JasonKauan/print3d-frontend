import { useEffect } from 'react'

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    success: 'border-success text-success',
    error:   'border-danger text-danger',
    info:    'border-accent text-accent',
  }

  return (
    <div className={`fixed bottom-5 right-5 z-50 bg-bg3 border rounded-xl px-4 py-3 text-sm shadow-lg ${colors[type]}`}>
      {message}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-bg2 border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-5 pt-5 pb-0">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── ModalConfirm ──────────────────────────────────────────────────────────────
export function ModalConfirm({ titulo, mensagem, onConfirmar, onCancelar }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancelar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancelar])

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <div className="bg-bg2 border border-border rounded-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-base mb-2">{titulo}</h3>
        <p className="text-gray-400 text-sm mb-6">{mensagem}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-ghost px-4 py-2" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-danger px-4 py-2" onClick={onConfirmar}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ text = 'Nenhum registro encontrado' }) {
  return (
    <div className="text-center py-12 text-gray-600 text-sm">{text}</div>
  )
}

// ── FormGroup ─────────────────────────────────────────────────────────────────
export function FormGroup({ label, children }) {
  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}