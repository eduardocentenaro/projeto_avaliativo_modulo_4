// Textos de interface a partir dos códigos da API

export const SITUACOES = {
  DISPONIVEL: 'Disponível',
  EM_PROCESSO: 'Em processo',
  RESERVADO: 'Reservado',
  ADOTADO: 'Adotado',
  ARQUIVADO: 'Arquivado',
}

export const STATUS_PEDIDO = {
  ANALISE: 'Em análise',
  ENTREVISTA: 'Entrevista agendada',
  APROVADA: 'Aprovada',
  CONCLUIDA: 'Adoção concluída',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
}

export const PORTES = { P: 'Pequeno', M: 'Médio', G: 'Grande' }
export const SEXOS = { M: 'Macho', F: 'Fêmea' }

export const EXPERIENCIAS = {
  PRIMEIRO: 'Será meu primeiro pet',
  JA_TEVE: 'Já tive pets',
  TEM_OUTROS: 'Tenho outros pets',
}

export const TEMPOS_SOZINHO = {
  ATE_4H: 'Até 4 horas',
  DE_4_A_8H: 'De 4 a 8 horas',
  MAIS_8H: 'Mais de 8 horas',
}

export const MORADIAS = {
  CASA: 'Casa',
  CASA_QUINTAL: 'Casa com quintal',
  APARTAMENTO: 'Apartamento',
}

// 30 -> "2 anos e 6 meses"; null -> "Idade não informada"
export function formatarIdade(meses) {
  if (meses === null || meses === undefined) return 'Idade não informada'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const textoAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return resto ? `${textoAnos} e ${resto} ${resto === 1 ? 'mês' : 'meses'}` : textoAnos
}

export function formatarData(data) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : ''
}
