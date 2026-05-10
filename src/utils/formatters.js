// Formata data ISO para DD/MM/YYYY
export const fmtData = (d) => {
  if (!d) return '—'
  const [y, m, dd] = d.split('T')[0].split('-')
  return `${dd}/${m}/${y}`
}

// Formata número para moeda brasileira
export const fmtMoeda = (v) => {
  if (v == null) return 'R$ 0,00'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
