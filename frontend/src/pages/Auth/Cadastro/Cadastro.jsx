import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import { MORADIAS } from '../../../services/formatar'
import styles from './Cadastro.module.css'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const FORM_INICIAL = {
  nome: '', email: '', telefone: '',
  cep: '', estado: '', rua: '', numero: '', bairro: '', cidade: '',
  moradia: '', moradores: '', outros_animais: '',
  senha: '', confirmarSenha: '', termo: false,
}

// (85) 99999-9999
function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// 00000-000
function mascaraCep(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

// Mesmas regras da API; confirmação de senha e termo só existem aqui no front
function validar(form) {
  const erros = {}
  const nome = form.nome.trim()
  if (nome.length < 3 || nome.length > 100) erros.nome = 'O nome deve ter de 3 a 100 caracteres.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) erros.email = 'Informe um e-mail válido.'
  if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(form.telefone)) erros.telefone = 'Use o formato (85) 99999-9999.'
  if (!/^\d{5}-\d{3}$/.test(form.cep)) erros.cep = 'Use o formato 00000-000.'
  if (!UFS.includes(form.estado)) erros.estado = 'Escolha o estado.'
  for (const campo of ['rua', 'numero', 'bairro', 'cidade']) {
    if (!form[campo].trim()) erros[campo] = 'Campo obrigatório.'
  }
  if (!form.moradia) erros.moradia = 'Escolha o tipo de moradia.'
  if (!(Number.isInteger(Number(form.moradores)) && Number(form.moradores) >= 1)) erros.moradores = 'Informe pelo menos 1 morador.'
  if (form.outros_animais === '') erros.outros_animais = 'Informe se há outros animais.'
  if (form.senha.length < 6) erros.senha = 'A senha precisa ter ao menos 6 caracteres.'
  if (form.confirmarSenha !== form.senha) erros.confirmarSenha = 'As senhas não conferem.'
  if (!form.termo) erros.termo = 'É preciso aceitar o termo de adoção responsável.'
  return erros
}

// Cadastro do lar adotivo: POST /lares-adotivos. Não faz login automático:
// leva ao /login com mensagem e e-mail preenchido, preservando o destino (ex.: o pet que ia adotar).
export default function Cadastro() {
  const navigate = useNavigate()
  const location = useLocation()
  const { redirectTo, petId } = location.state || {}

  const [form, setForm] = useState(FORM_INICIAL)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [avisoCep, setAvisoCep] = useState('')
  const [enviando, setEnviando] = useState(false)

  const alterar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function alterarCep(e) {
    const cep = mascaraCep(e.target.value)
    setForm((atual) => ({ ...atual, cep }))
    setAvisoCep('')
    if (cep.length !== 9) return

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`)
      const endereco = await resposta.json()
      if (endereco.erro) {
        setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      setForm((atual) => ({
        ...atual,
        rua: endereco.logradouro || atual.rua,
        bairro: endereco.bairro || atual.bairro,
        cidade: endereco.localidade || atual.cidade,
        estado: endereco.uf || atual.estado,
      }))
    } catch {
      setAvisoCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
    }
  }

  async function enviar(e) {
    e.preventDefault()
    setErroGeral('')
    const errosFront = validar(form)
    setErros(errosFront)
    if (Object.keys(errosFront).length) return

    const { confirmarSenha: _c, termo: _t, ...dados } = form
    setEnviando(true)
    try {
      await api.post('/lares-adotivos', {
        ...dados,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        moradores: Number(dados.moradores),
        outros_animais: dados.outros_animais === 'sim',
      })
      navigate('/login', {
        state: {
          mensagem: 'Cadastro realizado! Entre com seu e-mail e senha.',
          email: dados.email.trim().toLowerCase(),
          redirectTo,
          petId,
        },
      })
    } catch (err) {
      setErros(err.response?.data?.campos || {})
      setErroGeral(err.response?.data?.error || 'Não foi possível concluir o cadastro.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnviando(false)
    }
  }

  const erro = (campo) => erros[campo] && <span className="erro-campo">{erros[campo]}</span>

  return (
    <section className={styles.container}>
      <h1>Cadastre seu lar</h1>
      <p className="texto-suave">Preencha os dados abaixo para poder pedir a adoção de um pet.</p>

      {erroGeral && <p role="alert" className="alerta-erro">{erroGeral}</p>}

      <form onSubmit={enviar} noValidate>
        <fieldset className="card">
          <legend>Dados do lar</legend>
          <label>Nome<input value={form.nome} onChange={alterar('nome')} />{erro('nome')}</label>
          <div className={styles.linha}>
            <label>E-mail<input type="email" value={form.email} onChange={alterar('email')} autoComplete="email" />{erro('email')}</label>
            <label>Telefone<input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })} placeholder="(85) 99999-9999" inputMode="tel" />{erro('telefone')}</label>
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>Endereço</legend>
          <div className={styles.linha}>
            <label>CEP<input value={form.cep} onChange={alterarCep} placeholder="00000-000" inputMode="numeric" />{erro('cep')}</label>
            <label>
              Estado
              <select value={form.estado} onChange={alterar('estado')}>
                <option value="">UF</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              {erro('estado')}
            </label>
          </div>
          {avisoCep && <p className="texto-suave">{avisoCep}</p>}
          <div className={styles.linha}>
            <label>Rua<input value={form.rua} onChange={alterar('rua')} />{erro('rua')}</label>
            <label>Número<input value={form.numero} onChange={alterar('numero')} />{erro('numero')}</label>
          </div>
          <div className={styles.linha}>
            <label>Bairro<input value={form.bairro} onChange={alterar('bairro')} />{erro('bairro')}</label>
            <label>Cidade<input value={form.cidade} onChange={alterar('cidade')} />{erro('cidade')}</label>
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>Sobre o lar</legend>
          <div className={styles.linha}>
            <label>
              Tipo de moradia
              <select value={form.moradia} onChange={alterar('moradia')}>
                <option value="">Selecione...</option>
                {Object.entries(MORADIAS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
              </select>
              {erro('moradia')}
            </label>
            <label>Número de moradores<input type="number" min="1" value={form.moradores} onChange={alterar('moradores')} />{erro('moradores')}</label>
          </div>
          <div>
            <strong>Há outros animais na casa?</strong>
            <div className={styles.opcoes}>
              <label><input type="radio" name="outros_animais" value="sim" checked={form.outros_animais === 'sim'} onChange={alterar('outros_animais')} />Sim</label>
              <label><input type="radio" name="outros_animais" value="nao" checked={form.outros_animais === 'nao'} onChange={alterar('outros_animais')} />Não</label>
            </div>
            {erro('outros_animais')}
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>Acesso</legend>
          <div className={styles.linha}>
            <label>Senha<input type="password" value={form.senha} onChange={alterar('senha')} autoComplete="new-password" />{erro('senha')}</label>
            <label>Confirmar senha<input type="password" value={form.confirmarSenha} onChange={alterar('confirmarSenha')} autoComplete="new-password" />{erro('confirmarSenha')}</label>
          </div>
          <label className={styles.termo}>
            <input type="checkbox" checked={form.termo} onChange={alterar('termo')} />
            Li e aceito o termo de adoção responsável: vou cuidar do pet com carinho, garantir alimentação,
            saúde e segurança, e não vou abandoná-lo.
          </label>
          {erro('termo')}
        </fieldset>

        <button type="submit" disabled={enviando}>{enviando ? 'Cadastrando...' : 'Cadastrar'}</button>
      </form>

      <p><Link to="/login" state={location.state} replace>Já tenho cadastro</Link></p>
    </section>
  )
}
