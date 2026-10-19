import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import useSessao from '../../services/useSessao'
import { limparSessao } from '../../services/sessao'
import styles from './AdminLayout.module.css'

const MENU = [
  { to: '/admin/processos', rotulo: '📋 Processos' },
  { to: '/admin/pets', rotulo: '🐾 Pets' },
  { to: '/admin/lares', rotulo: '🏠 Lares adotivos' },
]

// Layout do painel administrativo: menu lateral + a tela da rota filha (<Outlet />).
// A proteção (só a equipe entra) fica no App.jsx, com o RotaProtegida.
export default function AdminLayout() {
  const sessao = useSessao()
  const navigate = useNavigate()

  function sair() {
    limparSessao()
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.menu}>
        <p><strong>🐾 Lab365PetAmigo</strong><br />Painel administrativo</p>
        <p>Olá, {sessao?.nome}</p>
        <nav>
          <ul>
            {MENU.map((item) => (
              <li key={item.to}><NavLink to={item.to}>{item.rotulo}</NavLink></li>
            ))}
          </ul>
        </nav>
        <hr />
        <p><Link to="/pets">🌐 Ver site</Link></p>
        <button type="button" onClick={sair}>🚪 Sair</button>
      </aside>
      <section className={styles.conteudo}>
        <Outlet />
      </section>
    </div>
  )
}
