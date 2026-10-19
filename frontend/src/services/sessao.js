// Sessão de quem está logado, guardada no localStorage na chave "@dadoslogin"
// (o services/api lê o token dessa mesma chave): { token, id, nome, email, role }
const CHAVE = '@dadoslogin'

export const ROLES = { ADMIN: 'admin', LAR: 'lar' }

// true quando o token JWT já passou do "exp" (expira em 24h)
function tokenExpirado(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

// Sessão salva, ou null se não houver ou se o token já expirou (nesse caso ela é apagada)
export function getSessao() {
  try {
    const sessao = JSON.parse(localStorage.getItem(CHAVE))
    if (!sessao) return null
    if (tokenExpirado(sessao.token)) {
      localStorage.removeItem(CHAVE)
      return null
    }
    return sessao
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
