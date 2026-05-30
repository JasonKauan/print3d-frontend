import api from './api'

export const produtoService = {
  listar: () => api.get('/produtos'),
  buscar: (id) => api.get(`/produtos/${id}`),

  // Usa FormData porque envia texto + arquivo (foto) juntos
  criar: (dados) => {
    const form = new FormData()
    form.append('nome', dados.nome)
    if (dados.descricao) form.append('descricao', dados.descricao)
    if (dados.preco)     form.append('preco', dados.preco)
    if (dados.estoque)   form.append('estoque', dados.estoque)
    if (dados.categoria) form.append('categoria', dados.categoria)
    if (dados.foto)      form.append('foto', dados.foto)
    return api.post('/produtos', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  atualizar: (id, dados) => {
    const form = new FormData()
    form.append('nome', dados.nome)
    if (dados.descricao)           form.append('descricao', dados.descricao)
    if (dados.preco)               form.append('preco', dados.preco)
    if (dados.estoque !== undefined) form.append('estoque', dados.estoque)
    if (dados.categoria)           form.append('categoria', dados.categoria)
    if (dados.foto)                form.append('foto', dados.foto)
    return api.put(`/produtos/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  deletar:           (id)            => api.delete(`/produtos/${id}`),
  stats:             ()              => api.get('/produtos/stats'),
  atualizarCategoria:(id, categoria) => api.patch(`/produtos/${id}/categoria`, { categoria }),
}
