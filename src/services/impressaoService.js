import api from './api'

export const impressaoService = {
  listar:       ()        => api.get('/impressoes'),
  listarMembro: (id)      => api.get('/impressoes', { params: { membro_id: id } }),
  buscar:       (id)      => api.get(`/impressoes/${id}`),
  criar:        (data)    => api.post('/impressoes', data),
  atualizar:    (id, data)=> api.put(`/impressoes/${id}`, data),
  deletar:      (id)      => api.delete(`/impressoes/${id}`),
}
