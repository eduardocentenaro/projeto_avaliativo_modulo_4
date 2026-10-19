import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../../services/api'
import { salvarSessao, telaInicial } from '../../../services/sessao'
import styles from './Login.module.css'

// Login único para a equipe e para os lares adotivos: POST /auth/login.
// A API devolve { token, id, nome, email, role }.
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  // tela de onde o usuário veio (ex.: uma rota protegida ou a página de um pet), para voltar depois do login.
  // petId: veio do botão de adotar; a página do pet usa isso para reabrir o pedido de adoção.
  // mensagem e email: vindos do cadastro, que manda o lar para cá depois de cadastrar
  // ?expirada=1&voltar=/tela: o services/api manda para cá quando a API recusa o token
  const [params] = useSearchParams()
  const voltar = params.get('voltar')
  const { petId } = location.state || {}
  const redirectTo = location.state?.redirectTo || (voltar?.startsWith('/') ? voltar : undefined)
  const mensagem =
    location.state?.mensagem || (params.get('expirada') ? 'Sua sessão expirou. Entre novamente.' : '')

  const [email, setEmail] = useState(location.state?.email || '')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const { data: usuario } = await api.post('/auth/login', { email, senha })
      salvarSessao(usuario)
      // volta para a tela de onde veio (repassando o petId para reabrir o pedido de adoção);
      // sem tela de retorno: equipe -> /admin/processos, lar -> /pets
      if (redirectTo) navigate(redirectTo, { replace: true, state: petId ? { petId } : undefined })
      else navigate(telaInicial(usuario.role), { replace: true })
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível conectar ao servidor.')
      setEnviando(false)
    }
  }

  return (
    <section className={styles.container}>
      <h1>Faça seu login</h1>

      {mensagem && !erro && <p className={styles.sucesso}>{mensagem}</p>}
      {erro && <p role="alert" className={styles.erro}>{erro}</p>}

      <form onSubmit={handleSubmit}>
        <p>
          <label>
            E-mail<br />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
        </p>
        <p>
          <label>
            Senha<br />
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </label>
        </p>
        <button type="submit" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
      </form>

      {/* repassa o state para o cadastro também voltar ao pet escolhido */}
      <p><Link to="/cadastro" state={location.state} replace>Não sou cadastrado</Link></p>
    </section>
  )
}
