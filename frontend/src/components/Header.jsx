import { Link, NavLink, useNavigate } from 'react-router-dom'
import useSessao from '../services/useSessao'
import { ROLES, limparSessao } from '../services/sessao'

// Menu do site, conforme quem está logado:
//   visitante -> Home, Pets, Entrar
//   lar       -> Home, Pets, Minhas adoções, nome, Sair
//   equipe    -> Pets, Painel admin, nome, Sair
export default function Header() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const equipe = sessao?.role === ROLES.ADMIN

  function sair() {
    limparSessao()
    navigate('/login')
  }

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link to="/" className="marca">🐾 Lab365PetAmigo</Link>
        <div className="links">
          {!equipe && <NavLink to="/" end>Home</NavLink>}
          <NavLink to="/pets">Pets</NavLink>
          {sessao?.role === ROLES.LAR && <NavLink to="/minhas-adocoes">Minhas adoções</NavLink>}
          {equipe && <NavLink to="/admin">Painel admin</NavLink>}
          {sessao ? (
            <>
              <span className="usuario">Olá, {sessao.nome}</span>
              <button type="button" className="botao-link" onClick={sair}>Sair</button>
            </>
          ) : (
            <NavLink to="/login" className="botao">Entrar</NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}
