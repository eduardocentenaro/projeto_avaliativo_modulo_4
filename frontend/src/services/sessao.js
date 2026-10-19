// Sessão de quem está logado, guardada no localStorage na chave "@dadoslogin"
// (o services/api lê o token dessa mesma chave): { token, id, nome, email, role }
const CHAVE = '@dadoslogin'

export const ROLES = { ADMIN: 'admin', LAR: 'lar' }

export function getSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || null
  } catch {
    return null
  }
}

export function salvarSessao(usuario) {
  localStorage.setItem(CHAVE, JSON.stringify(usuario))
  window.dispatchEvent(new Event('sessao'))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE)
  window.dispatchEvent(new Event('sessao'))
}

// para onde cada perfil vai depois de entrar, quando não há tela de retorno
export const telaInicial = (role) => (role === ROLES.ADMIN ? '/admin/processos' : '/pets')
