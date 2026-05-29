import api from './api'

export const configuracaoService = {
  listar:               ()                    => api.get('/configuracoes'),
  atualizar:            (data)                => api.patch('/configuracoes', data),
  atualizarRepasseMembro: (membroId, percentual) => api.patch(`/configuracoes/membros/${membroId}/repasse`, { percentual: String(percentual) }),
  removerRepasseMembro:   (membroId)          => api.delete(`/configuracoes/membros/${membroId}/repasse`),
}

export const producaoService = {
  calcular: (filamentoId, gramas) => api.get('/producao/calcular', { params: { filamentoId, gramas } }),
}