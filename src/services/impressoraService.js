import api from './api'

export const impressoraService = {
  listar:        ()           => api.get('/impressoras'),
  buscar:        (id)         => api.get(`/impressoras/${id}`),
  criar:         (data)       => api.post('/impressoras', data),
  atualizar:     (id, data)   => api.put(`/impressoras/${id}`, data),
  deletar:       (id)         => api.delete(`/impressoras/${id}`),
  iniciarUso:    (id, data)   => api.post(`/impressoras/${id}/usar`, data),
  finalizarUso:  (id, data)   => api.post(`/impressoras/${id}/finalizar`, data),
  alterarStatus: (id, status) => api.patch(`/impressoras/${id}/status`, { status }),
}