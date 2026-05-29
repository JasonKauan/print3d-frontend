import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COR_PRIMARIA  = [79, 124, 255]   // accent blue
const COR_DARK      = [15, 17, 23]     // bg
const COR_TEXTO     = [50, 50, 50]
const COR_CINZA     = [240, 242, 246]

function fmtMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('T')[0].split('-')
  return `${dd}/${m}/${y}`
}

let _nomeEntidade = 'Print3D'
export function setNomeEntidade(nome) { _nomeEntidade = nome || 'Print3D' }

function cabecalho(doc, titulo, subtitulo) {
  // Fundo do cabeçalho
  doc.setFillColor(...COR_DARK)
  doc.rect(0, 0, 210, 28, 'F')

  // Logo / título
  doc.setTextColor(79, 124, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`◈ ${_nomeEntidade}`, 14, 12)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.text(titulo, 14, 20)

  // Subtítulo e data à direita
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text(subtitulo, 14, 26)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 196, 26, { align: 'right' })

  return 34 // y inicial do conteúdo
}

function rodape(doc) {
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`Página ${i} de ${totalPaginas}`, 196, 290, { align: 'right' })
    doc.text(`${_nomeEntidade} — Sistema de Gestão`, 14, 290)
  }
}

function statBox(doc, x, y, label, value, corValor = COR_TEXTO) {
  doc.setFillColor(...COR_CINZA)
  doc.roundedRect(x, y, 56, 18, 2, 2, 'F')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text(label.toUpperCase(), x + 4, y + 6)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corValor)
  doc.text(value, x + 4, y + 14)
}

// ── EXTRATO INDIVIDUAL ────────────────────────────────────────────────────────
export function gerarExtratoMembro(membro, vendas, resumo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = cabecalho(doc, `Extrato — ${membro.nome}`, `${membro.email} • ${membro.role.toLowerCase()}`)

  // Stats
  statBox(doc, 14,  y, 'Total vendido',   fmtMoeda(resumo.totalVendas),   [46, 204, 138])
  statBox(doc, 76,  y, 'Total a repassar', fmtMoeda(resumo.totalRepasse), [255, 181, 71])
  statBox(doc, 138, y, 'Já repassado',    fmtMoeda(resumo.totalPago),     [79, 124, 255])
  y += 26

  // Pendente destaque
  if (Number(resumo.totalPendente) > 0) {
    doc.setFillColor(255, 92, 122, 0.15)
    doc.setFillColor(255, 235, 238)
    doc.roundedRect(14, y, 182, 10, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 50, 80)
    doc.text(`⚠  Repasse pendente: ${fmtMoeda(resumo.totalPendente)}`, 18, y + 7)
    y += 16
  }

  // Tabela de vendas
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COR_TEXTO)
  doc.text('Histórico de vendas', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Produto', 'Qtd', 'Valor total', 'Repasse', 'Data', 'Status']],
    body: vendas.map(v => [
      v.produtoNome,
      v.quantidade,
      fmtMoeda(v.valorTotal),
      fmtMoeda(v.repasse),
      fmtData(v.dataVenda),
      v.statusRepasse === 'PAGO' ? 'Pago' : 'Pendente',
    ]),
    headStyles: {
      fillColor: COR_PRIMARIA,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: COR_TEXTO },
    alternateRowStyles: { fillColor: COR_CINZA },
    columnStyles: {
      5: { fontStyle: 'bold',
           textColor: (cell) => cell.raw === 'Pago' ? [46, 204, 138] : [255, 92, 122] }
    },
    margin: { left: 14, right: 14 },
  })

  rodape(doc)
  doc.save(`extrato_${membro.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ── RELATÓRIO GERAL ───────────────────────────────────────────────────────────
export function gerarRelatorioGeral(resumos, vendas) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  let y = cabecalho(doc, 'Relatório Financeiro Geral', mes)

  // Totais gerais
  const totalVendas   = resumos.reduce((s, r) => s + Number(r.totalVendas), 0)
  const totalRepasse  = resumos.reduce((s, r) => s + Number(r.totalRepasse), 0)
  const totalPago     = resumos.reduce((s, r) => s + Number(r.totalPago), 0)
  const totalPendente = resumos.reduce((s, r) => s + Number(r.totalPendente), 0)

  statBox(doc, 14,  y, 'Total vendido',    fmtMoeda(totalVendas),   [46, 204, 138])
  statBox(doc, 76,  y, 'Total repassado',  fmtMoeda(totalPago),     [79, 124, 255])
  statBox(doc, 138, y, 'Pendente',         fmtMoeda(totalPendente), [255, 92, 122])
  y += 26

  // Resumo por membro
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COR_TEXTO)
  doc.text('Resumo por produtor', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Membro', 'Total vendas', 'A repassar', 'Já pago', 'Pendente']],
    body: resumos.map(r => [
      r.membroNome,
      fmtMoeda(r.totalVendas),
      fmtMoeda(r.totalRepasse),
      fmtMoeda(r.totalPago),
      fmtMoeda(r.totalPendente),
    ]),
    headStyles: { fillColor: COR_PRIMARIA, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: COR_TEXTO },
    alternateRowStyles: { fillColor: COR_CINZA },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 10

  // Todas as vendas
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COR_TEXTO)
  doc.text('Todas as vendas', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Membro', 'Produto', 'Qtd', 'Valor', 'Repasse', 'Data', 'Status']],
    body: vendas.map(v => [
      v.membroNome,
      v.produtoNome,
      v.quantidade,
      fmtMoeda(v.valorTotal),
      fmtMoeda(v.repasse),
      fmtData(v.dataVenda),
      v.statusRepasse === 'PAGO' ? 'Pago' : 'Pendente',
    ]),
    headStyles: { fillColor: COR_PRIMARIA, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: COR_TEXTO },
    alternateRowStyles: { fillColor: COR_CINZA },
    margin: { left: 14, right: 14 },
  })

  rodape(doc)
  doc.save(`relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`)
}