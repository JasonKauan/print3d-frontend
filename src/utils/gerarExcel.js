import * as XLSX from 'xlsx'

function fmtData(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('pt-BR')
}

function fmtMoeda(v) {
  if (v == null) return ''
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function autoWidth(ws, data) {
  if (!data.length) return
  const cols = Object.keys(data[0])
  ws['!cols'] = cols.map(col => ({
    wch: Math.max(col.length, ...data.map(r => String(r[col] ?? '').length)) + 2
  }))
}

function criarAba(dados, cabecalhos) {
  const ws = XLSX.utils.json_to_sheet(dados, { header: Object.keys(cabecalhos) })
  // Renomeia os cabeçalhos para português
  Object.keys(cabecalhos).forEach((key, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cell]) ws[cell].v = cabecalhos[key]
  })
  autoWidth(ws, dados)
  return ws
}

export function gerarRelatorioExcel({ vendas, impressoes, movimentacoes, filamentos }) {
  const wb = XLSX.utils.book_new()

  // ── ABA 1: VENDAS ──────────────────────────────────────────────────────────
  if (vendas?.length) {
    const dadosVendas = vendas.map(v => ({
      membro:        v.membroNome    || '',
      produto:       v.produtoNome   || '',
      quantidade:    v.quantidade    || 0,
      valorTotal:    fmtMoeda(v.valorTotal),
      repasse:       fmtMoeda(v.repasse),
      statusRepasse: v.statusRepasse === 'PAGO' ? 'Pago' : 'Pendente',
      dataVenda:     fmtData(v.dataVenda),
    }))
    const ws = criarAba(dadosVendas, {
      membro:        'Membro',
      produto:       'Produto',
      quantidade:    'Qtd',
      valorTotal:    'Valor Total',
      repasse:       'Repasse',
      statusRepasse: 'Status Repasse',
      dataVenda:     'Data da Venda',
    })
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas')
  }

  // ── ABA 2: IMPRESSÕES ──────────────────────────────────────────────────────
  if (impressoes?.length) {
    const dadosImpressoes = impressoes.map(i => ({
      membro:         i.membroNome     || '',
      produto:        i.produtoNome    || '',
      impressora:     i.impressoraNome || '—',
      filamento:      i.filamentoNome  || '—',
      quantidade:     i.quantidade     || 0,
      gramasUsadas:   i.gramasUsadas   != null ? Number(i.gramasUsadas).toFixed(1) + 'g' : '—',
      custoFilamento: i.custoFilamento != null ? fmtMoeda(i.custoFilamento) : '—',
      tempo:          i.tempoImpressao || '—',
      data:           fmtData(i.dataImpressao),
      observacao:     i.observacao     || '',
    }))
    const ws = criarAba(dadosImpressoes, {
      membro:         'Membro',
      produto:        'Produto',
      impressora:     'Impressora',
      filamento:      'Filamento',
      quantidade:     'Qtd',
      gramasUsadas:   'Gramas Usadas',
      custoFilamento: 'Custo Filamento',
      tempo:          'Tempo',
      data:           'Data',
      observacao:     'Observações',
    })
    XLSX.utils.book_append_sheet(wb, ws, 'Impressões')
  }

  // ── ABA 3: ESTOQUE ─────────────────────────────────────────────────────────
  if (movimentacoes?.length) {
    const TIPO_LABEL = {
      ENTRADA_CADASTRO:      'Entrada — Cadastro',
      ENTRADA_IMPRESSAO:     'Entrada — Impressão',
      SAIDA_VENDA:           'Saída — Venda',
      AJUSTE_MANUAL_ENTRADA: 'Ajuste Manual (+)',
      AJUSTE_MANUAL_SAIDA:   'Ajuste Manual (-)',
      CONSUMO_FILAMENTO:     'Consumo de Filamento',
    }
    const dadosEstoque = movimentacoes.map(m => ({
      item:          m.itemNome  || '',
      tipoItem:      m.tipoItem === 'PRODUTO' ? 'Produto' : 'Filamento',
      tipo:          TIPO_LABEL[m.tipo] || m.tipo,
      quantidade:    Number(m.quantidade).toFixed(m.tipoItem === 'FILAMENTO' ? 1 : 0),
      estoqueAntes:  Number(m.estoqueAntes).toFixed(m.tipoItem === 'FILAMENTO' ? 1 : 0),
      estoqueDepois: Number(m.estoqueDepois).toFixed(m.tipoItem === 'FILAMENTO' ? 1 : 0),
      responsavel:   m.membroNome   || 'Sistema',
      justificativa: m.justificativa || '',
      data:          m.criadoEm ? new Date(m.criadoEm).toLocaleString('pt-BR') : '',
    }))
    const ws = criarAba(dadosEstoque, {
      item:          'Item',
      tipoItem:      'Tipo',
      tipo:          'Movimentação',
      quantidade:    'Quantidade',
      estoqueAntes:  'Estoque Antes',
      estoqueDepois: 'Estoque Depois',
      responsavel:   'Responsável',
      justificativa: 'Justificativa',
      data:          'Data/Hora',
    })
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque')
  }

  // ── ABA 4: FILAMENTOS ──────────────────────────────────────────────────────
  if (filamentos?.length) {
    const STATUS_LABEL = { DISPONIVEL: 'Disponível', ESGOTADO: 'Esgotado', RESERVADO: 'Reservado' }
    const dadosFilamentos = filamentos.map(f => ({
      nome:              f.nome              || '',
      marca:             f.marca             || '',
      tipo:              f.tipo              || '',
      cor:               f.cor               || '',
      pesoTotal:         Number(f.pesoTotalGramas).toFixed(0) + 'g',
      pesoDisponivel:    Number(f.pesoDisponivelGramas).toFixed(0) + 'g',
      percentualUsado:   f.percentualUsado + '%',
      precoPago:         fmtMoeda(f.precoPago),
      custoPorGrama:     'R$ ' + Number(f.custoPorGrama).toFixed(4) + '/g',
      status:            STATUS_LABEL[f.status] || f.status,
      dataCompra:        fmtData(f.dataCompra),
    }))
    const ws = criarAba(dadosFilamentos, {
      nome:           'Nome',
      marca:          'Marca',
      tipo:           'Tipo',
      cor:            'Cor',
      pesoTotal:      'Peso Total',
      pesoDisponivel: 'Disponível',
      percentualUsado:'% Usado',
      precoPago:      'Preço Pago',
      custoPorGrama:  'Custo/Grama',
      status:         'Status',
      dataCompra:     'Data de Compra',
    })
    XLSX.utils.book_append_sheet(wb, ws, 'Filamentos')
  }

  // Gera e faz download do arquivo
  const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  XLSX.writeFile(wb, `Print3D_Relatorio_${data}.xlsx`)
}

// Exportação individual por membro — para o Financeiro
export function gerarExtratoMembroExcel(membro, vendas) {
  const wb = XLSX.utils.book_new()

  const dadosVendas = vendas.map(v => ({
    produto:       v.produtoNome   || '',
    quantidade:    v.quantidade    || 0,
    valorTotal:    fmtMoeda(v.valorTotal),
    repasse:       fmtMoeda(v.repasse),
    statusRepasse: v.statusRepasse === 'PAGO' ? 'Pago' : 'Pendente',
    dataVenda:     fmtData(v.dataVenda),
  }))

  const ws = criarAba(dadosVendas, {
    produto:       'Produto',
    quantidade:    'Qtd',
    valorTotal:    'Valor Total',
    repasse:       'Repasse',
    statusRepasse: 'Status',
    dataVenda:     'Data',
  })

  XLSX.utils.book_append_sheet(wb, ws, 'Extrato')

  const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  XLSX.writeFile(wb, `Print3D_Extrato_${membro.nome}_${data}.xlsx`)
}