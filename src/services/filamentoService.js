import api from './api'

export const filamentoService = {
  listar:           ()       => api.get('/filamentos'),
  listarDisponiveis:()       => api.get('/filamentos?disponiveis=true'),
  buscar:           (id)     => api.get(`/filamentos/${id}`),
  criar:            (data)   => api.post('/filamentos', data),
  atualizar:        (id, data) => api.put(`/filamentos/${id}`, data),
  deletar:          (id)     => api.delete(`/filamentos/${id}`),
  totalInvestido:   ()       => api.get('/filamentos/total-investido'),
}