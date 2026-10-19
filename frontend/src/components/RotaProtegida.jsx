import { Navigate, useLocation } from 'react-router-dom'
import useSessao from '../services/useSessao'
import { telaInicial } from '../services/sessao'

// Só deixa entrar quem tem um dos perfis em "roles".
// Sem login: vai para o login e volta para esta tela depois. Perfil errado: vai para a tela inicial dele.
export default function RotaProtegida({ roles, children }) {
  const sessao = useSessao()
  const location = useLocation()

  if (!sessao) {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />
  }
  if (!roles.includes(sessao.role)) {
    return <Navigate to={telaInicial(sessao.role)} replace />
  }
  return children
}
