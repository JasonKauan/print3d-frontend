import api from './api'

export const vendaService = {
  listar:          ()           => api.get('/vendas'),
  buscar:          (id)         => api.get(`/vendas/${id}`),
  criar:           (data)       => api.post('/vendas', data),
  atualizarStatus: (id, status) => api.patch(`/vendas/${id}/status`, { status }),
  resumoGeral:     ()           => api.get('/vendas/resumo'),
  resumoMembro:    (id)         => api.get(`/vendas/resumo?membro_id=${id}`),
}
