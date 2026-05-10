import api from './api'

export const membroService = {
  listar: (status) => api.get('/membros', { params: status ? { status } : {} }),
  buscar: (id)     => api.get(`/membros/${id}`),
  criar:  (data)   => api.post('/membros', data),
  atualizar: (id, data) => api.put(`/membros/${id}`, data),
  deletar: (id)    => api.delete(`/membros/${id}`),
}
