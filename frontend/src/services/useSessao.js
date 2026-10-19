import { useEffect, useState } from 'react'
import { getSessao } from './sessao'

// Sessão atual, atualizada quando alguém entra ou sai (nesta aba ou em outra)
export default function useSessao() {
  const [sessao, setSessao] = useState(getSessao)

  useEffect(() => {
    const atualizar = () => setSessao(getSessao())
    window.addEventListener('sessao', atualizar)
    window.addEventListener('storage', atualizar)
    return () => {
      window.removeEventListener('sessao', atualizar)
      window.removeEventListener('storage', atualizar)
    }
  }, [])

  return sessao
}
