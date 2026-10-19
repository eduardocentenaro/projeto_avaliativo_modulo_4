import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../services/api'
import { STATUS_PEDIDO, formatarData, formatarIdade } from '../../../services/formatar'
import styles from './MinhasAdocoes.module.css'

const SEM_FOTO = 'https://placehold.co/300x300?text=Sem+foto'
const ETAPAS = ['ANALISE', 'ENTREVISTA', 'APROVADA', 'CONCLUIDA']
const EM_ANDAMENTO = ['ANALISE', 'ENTREVISTA', 'APROVADA']
const ENCERRADOS = ['RECUSADA', 'CANCELADA']

const PROXIMO_PASSO = {
  ANALISE: 'A equipe está analisando seu pedido e vai chamar você para uma entrevista.',
  ENTREVISTA: 'Entrevista agendada: a equipe vai conversar com você para conhecer melhor o seu lar.',
  APROVADA: 'Pedido aprovado! Combine com a equipe a data da entrega do pet.',
}

// número da ONG com DDI e DDD, só dígitos (ex.: 5585999999999), no .env do front
const WHATSAPP = import.meta.env.VITE_WHATSAPP_ONG || ''

function linkWhatsApp(adocao) {
  const texto = encodeURIComponent(`Olá! Sobre o meu pedido de adoção nº ${adocao.id} (${adocao.pet?.nome}).`)
  return `https://wa.me/${WHATSAPP}?text=${texto}`
}

// data da etapa com o status informado (a última, se houver mais de uma)
const dataDaEtapa = (adocao, status) =>
  [...(adocao.historico || [])].reverse().find((h) => h.status === status)?.criado_em

const ultimaEtapa = (adocao) => adocao.historico?.[adocao.historico.length - 1]

// Pedidos do lar logado: GET /minhas-adocoes, em três grupos.
// O lar não cancela pelo site: desistências são tratadas com a equipe pelo WhatsApp.
export default function MinhasAdocoes() {
  const [adocoes, setAdocoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/minhas-adocoes')
      .then(({ data }) => setAdocoes(data))
      .catch((err) => setErro(err.response?.data?.error || 'Não foi possível carregar seus pedidos.'))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <p>Carregando seus pedidos...</p>
  if (erro) return <p className="alerta-erro">{erro}</p>

  const andamento = adocoes.filter((a) => EM_ANDAMENTO.includes(a.status))
  const adotados = adocoes.filter((a) => a.status === 'CONCLUIDA')
  const encerrados = adocoes.filter((a) => ENCERRADOS.includes(a.status))

  if (adocoes.length === 0) {
    return (
      <section>
        <h1>Minhas adoções</h1>
        <div className="card">
          <p>Você ainda não fez nenhum pedido de adoção.</p>
          <Link to="/pets" className="botao">Ver pets disponíveis</Link>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1>Minhas adoções</h1>

      <h2>Em andamento</h2>
      {andamento.length === 0 && <p className="texto-suave">Nenhum pedido em andamento.</p>}
      {andamento.map((adocao) => {
        const etapaAtual = ETAPAS.indexOf(adocao.status)
        return (
          <article key={adocao.id} className={`card ${styles.pedido}`}>
            <img src={adocao.pet?.foto_url || SEM_FOTO} alt={adocao.pet?.nome} />
            <div className={styles.corpo}>
              <h3>{adocao.pet?.nome}</h3>
              <p className="texto-suave">
                {adocao.pet?.raca?.nome} · {formatarIdade(adocao.pet?.idade_meses)}
              </p>
              <p>
                Pedido nº {adocao.id} · enviado em {formatarData(adocao.criado_em)} ·{' '}
                <strong>{STATUS_PEDIDO[adocao.status]}</strong>
              </p>
              <ol className={styles.etapas}>
                {ETAPAS.map((etapa, i) => (
                  <li key={etapa} className={i <= etapaAtual ? styles.feita : ''}>{STATUS_PEDIDO[etapa]}</li>
                ))}
              </ol>
              <p><strong>Próximo passo:</strong> {PROXIMO_PASSO[adocao.status]}</p>
              <details>
                <summary>Histórico do pedido</summary>
                <ul>
                  {adocao.historico.map((h) => (
                    <li key={h.id}>
                      {formatarData(h.criado_em)} · {STATUS_PEDIDO[h.status]}
                      {h.observacao && <> — {h.observacao}</>}
                    </li>
                  ))}
                </ul>
              </details>
              <div className={styles.acoes}>
                <Link to={`/pets/${adocao.pet_id}`} className="botao botao-secundario">Ver o pet</Link>
                <a href={linkWhatsApp(adocao)} target="_blank" rel="noreferrer" className="botao">
                  Falar com a equipe no WhatsApp
                </a>
              </div>
            </div>
          </article>
        )
      })}

      <h2>Pets adotados</h2>
      {adotados.length === 0 && <p className="texto-suave">Nenhuma adoção concluída ainda.</p>}
      <div className="grade">
        {adotados.map((adocao) => (
          <article key={adocao.id} className={`card ${styles.adotado}`}>
            <img src={adocao.pet?.foto_url || SEM_FOTO} alt={adocao.pet?.nome} />
            <h3>{adocao.pet?.nome}</h3>
            <p className="texto-suave">
              {adocao.pet?.raca?.nome} · {formatarIdade(adocao.pet?.idade_meses)}
            </p>
            <p>🎉 Adotado em {formatarData(dataDaEtapa(adocao, 'CONCLUIDA'))}</p>
          </article>
        ))}
      </div>

      <h2>Pedidos encerrados</h2>
      {encerrados.length === 0 && <p className="texto-suave">Nenhum pedido encerrado.</p>}
      {encerrados.map((adocao) => {
        const ultima = ultimaEtapa(adocao)
        return (
          <article key={adocao.id} className={`card ${styles.encerrado}`}>
            <img src={adocao.pet?.foto_url || SEM_FOTO} alt={adocao.pet?.nome} />
            <div>
              <h3>{adocao.pet?.nome}</h3>
              <p>
                Pedido nº {adocao.id} · {STATUS_PEDIDO[adocao.status]} em {formatarData(ultima?.criado_em)}
              </p>
              {ultima?.observacao && <p className="texto-suave">Motivo: {ultima.observacao}</p>}
            </div>
          </article>
        )
      })}
    </section>
  )
}
