import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../../../services/api'
import useSessao from '../../../services/useSessao'
import { ROLES } from '../../../services/sessao'
import {
  EXPERIENCIAS,
  PORTES,
  SEXOS,
  SITUACOES,
  STATUS_PEDIDO,
  TEMPOS_SOZINHO,
  formatarData,
  formatarIdade,
} from '../../../services/formatar'
import styles from './PetDetalhe.module.css'

const SEM_FOTO = 'https://placehold.co/600x450?text=Sem+foto'
const ETAPAS = ['ANALISE', 'ENTREVISTA', 'APROVADA', 'CONCLUIDA']
const NAO_ACEITA_PEDIDOS = ['RESERVADO', 'ADOTADO', 'ARQUIVADO']
const FORM_VAZIO = { motivo: '', experiencia: '', tempo_sozinho: '' }

// Detalhes do pet (GET /pets/:id) e área de adoção:
//   visitante -> convite para entrar/cadastrar (volta para cá com o formulário aberto)
//   lar       -> GET /pets/:id/minha-adocao: 200 mostra o pedido; 204 libera o formulário (POST /adocoes)
export default function PetDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const sessao = useSessao()
  const ehLar = sessao?.role === ROLES.LAR

  const [pet, setPet] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // o login/cadastro devolve { petId } quando a pessoa clicou em "Quero adotar" antes de entrar
  const [formAberto, setFormAberto] = useState(String(location.state?.petId) === String(id))
  const [form, setForm] = useState(FORM_VAZIO)
  const [errosForm, setErrosForm] = useState({})
  const [erroEnvio, setErroEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setCarregando(true)
      try {
        const { data } = await api.get(`/pets/${id}`)
        if (!ativo) return
        setPet(data)
        if (ehLar) {
          const resposta = await api.get(`/pets/${id}/minha-adocao`)
          if (ativo) setPedido(resposta.status === 200 ? resposta.data : null)
        }
      } catch (err) {
        if (err.response?.status === 404) return navigate('/pets', { replace: true })
        if (ativo) setErro(err.response?.data?.error || 'Não foi possível carregar o pet.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [id, ehLar, navigate])

  function validar() {
    const erros = {}
    if (form.motivo.trim().length < 10) erros.motivo = 'Conte em pelo menos 10 caracteres por que quer adotar.'
    if (!form.experiencia) erros.experiencia = 'Escolha sua experiência com pets.'
    if (!form.tempo_sozinho) erros.tempo_sozinho = 'Informe quanto tempo o pet ficaria sozinho.'
    return erros
  }

  async function enviar(e) {
    e.preventDefault()
    setErroEnvio('')
    const erros = validar()
    setErrosForm(erros)
    if (Object.keys(erros).length) return

    setEnviando(true)
    try {
      const { data } = await api.post('/adocoes', { pet_id: Number(id), ...form, motivo: form.motivo.trim() })
      setPedido(data)
      setSucesso(true)
      setFormAberto(false)
      setForm(FORM_VAZIO)
      const { data: petAtualizado } = await api.get(`/pets/${id}`)
      setPet(petAtualizado)
    } catch (err) {
      setErrosForm(err.response?.data?.campos || {})
      setErroEnvio(err.response?.data?.error || 'Não foi possível enviar o pedido.')
    } finally {
      setEnviando(false)
    }
  }

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  if (carregando) return <p>Carregando...</p>
  if (erro) return <p className="alerta-erro">{erro}</p>
  if (!pet) return null

  const voltarPara = { redirectTo: `/pets/${id}`, petId: Number(id) }
  const aceitaPedidos = !NAO_ACEITA_PEDIDOS.includes(pet.situacao)

  return (
    <section>
      <p><Link to={`/pets?tipo=${pet.tipo_id}`}>← Voltar para a vitrine</Link></p>

      <div className={styles.topo}>
        <img src={pet.foto_url || SEM_FOTO} alt={pet.nome} className={styles.foto} />

        <div>
          <h1 className={styles.nome}>
            {pet.nome} <span className={`selo selo-${pet.situacao}`}>{SITUACOES[pet.situacao]}</span>
          </h1>

          <dl className={`card ${styles.ficha}`}>
            <dt>Tipo</dt><dd>{pet.tipo?.nome}</dd>
            <dt>Raça</dt><dd>{pet.raca?.nome}</dd>
            <dt>Cor</dt><dd>{pet.cor?.nome}</dd>
            <dt>Idade</dt><dd>{formatarIdade(pet.idade_meses)}</dd>
            <dt>Sexo</dt><dd>{SEXOS[pet.sexo] || 'Não informado'}</dd>
            <dt>Porte</dt><dd>{PORTES[pet.porte]}</dd>
          </dl>

          <div className={`card ${styles.adocao}`}>
            <h2>Adoção</h2>
            {sucesso && <p className="alerta-sucesso">Pedido enviado! A equipe vai analisar e entrar em contato pelo WhatsApp.</p>}

            {!sessao && (
              aceitaPedidos ? (
                <>
                  <p>Para pedir a adoção de {pet.nome}, entre na sua conta ou cadastre seu lar.</p>
                  <div className={styles.acoes}>
                    <Link to="/login" state={voltarPara} className="botao">Entrar</Link>
                    <Link to="/cadastro" state={voltarPara} className="botao botao-secundario">Cadastrar meu lar</Link>
                  </div>
                </>
              ) : (
                <button type="button" disabled>Adoção indisponível</button>
              )
            )}

            {sessao?.role === ROLES.ADMIN && (
              <p className="texto-suave">Os pedidos de adoção são feitos pelos lares adotivos.</p>
            )}

            {ehLar && pedido && <Pedido pedido={pedido} />}

            {ehLar && !pedido && !aceitaPedidos && (
              <>
                <button type="button" disabled>Adoção indisponível</button>
                <p className="texto-suave">
                  {pet.situacao === 'RESERVADO' && 'Este pet já está reservado para outro lar.'}
                  {pet.situacao === 'ADOTADO' && 'Este pet já foi adotado.'}
                  {pet.situacao === 'ARQUIVADO' && 'Este pet não está mais disponível para adoção.'}
                </p>
              </>
            )}

            {ehLar && !pedido && aceitaPedidos && !formAberto && (
              <button type="button" onClick={() => setFormAberto(true)}>Quero adotar {pet.nome}</button>
            )}

            {ehLar && !pedido && aceitaPedidos && formAberto && (
              <form onSubmit={enviar} noValidate>
                {erroEnvio && <p role="alert" className="alerta-erro">{erroEnvio}</p>}
                <label>
                  Por que você quer adotar {pet.nome}?
                  <textarea rows={4} value={form.motivo} onChange={alterar('motivo')} />
                  {errosForm.motivo && <span className="erro-campo">{errosForm.motivo}</span>}
                </label>
                <label>
                  Experiência com pets
                  <select value={form.experiencia} onChange={alterar('experiencia')}>
                    <option value="">Selecione...</option>
                    {Object.entries(EXPERIENCIAS).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>{rotulo}</option>
                    ))}
                  </select>
                  {errosForm.experiencia && <span className="erro-campo">{errosForm.experiencia}</span>}
                </label>
                <label>
                  Quanto tempo o pet ficaria sozinho por dia?
                  <select value={form.tempo_sozinho} onChange={alterar('tempo_sozinho')}>
                    <option value="">Selecione...</option>
                    {Object.entries(TEMPOS_SOZINHO).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>{rotulo}</option>
                    ))}
                  </select>
                  {errosForm.tempo_sozinho && <span className="erro-campo">{errosForm.tempo_sozinho}</span>}
                </label>
                <div className={styles.acoes}>
                  <button type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar pedido'}</button>
                  <button type="button" className="botao-secundario" onClick={() => setFormAberto(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className={styles.textos}>
        {pet.historia && (<><h2>História</h2><p>{pet.historia}</p></>)}
        {pet.comportamento && (<><h2>Comportamento</h2><p>{pet.comportamento}</p></>)}
        {pet.observacoes_extras && (<><h2>Observações</h2><p>{pet.observacoes_extras}</p></>)}
      </div>
    </section>
  )
}

// Situação do pedido do lar para este pet
function Pedido({ pedido }) {
  if (pedido.status === 'CONCLUIDA') {
    return <p className="alerta-sucesso">🎉 Você já adotou este pet! Pedido nº {pedido.id}.</p>
  }

  const etapaAtual = ETAPAS.indexOf(pedido.status)
  return (
    <>
      <p>
        Seu pedido nº {pedido.id} está: <strong>{STATUS_PEDIDO[pedido.status]}</strong>
      </p>
      <ol className={styles.etapas}>
        {ETAPAS.map((etapa, i) => (
          <li key={etapa} className={i <= etapaAtual ? styles.feita : ''}>{STATUS_PEDIDO[etapa]}</li>
        ))}
      </ol>
      <ul className={styles.historico}>
        {pedido.historico?.map((h) => (
          <li key={h.id}>
            <strong>{formatarData(h.criado_em)}</strong> · {STATUS_PEDIDO[h.status]}
            {h.observacao && <> — {h.observacao}</>}
          </li>
        ))}
      </ul>
      <p className="texto-suave">Acompanhe também em <Link to="/minhas-adocoes">Minhas adoções</Link>.</p>
    </>
  )
}
