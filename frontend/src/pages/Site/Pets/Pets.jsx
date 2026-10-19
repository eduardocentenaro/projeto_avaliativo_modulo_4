import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../../services/api'
import { PORTES, SITUACOES, formatarIdade } from '../../../services/formatar'
import styles from './Pets.module.css'

const SEM_FOTO = 'https://placehold.co/400x300?text=Sem+foto'

// Vitrine: GET /pets-disponiveis (disponíveis, em processo e reservados).
// Começa com a escolha da espécie; a espécie escolhida fica na URL (?tipo=1) para o "voltar" funcionar.
export default function Pets() {
  const [pets, setPets] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [params, setParams] = useSearchParams()
  const tipoId = Number(params.get('tipo')) || null

  useEffect(() => {
    api
      .get('/pets-disponiveis')
      .then(({ data }) => setPets(data))
      .catch((err) => setErro(err.response?.data?.error || 'Não foi possível carregar os pets.'))
      .finally(() => setCarregando(false))
  }, [])

  // um card por espécie, com a quantidade de pets e a foto de um deles
  const especies = useMemo(() => {
    const porTipo = new Map()
    for (const pet of pets) {
      const especie = porTipo.get(pet.tipo_id) || { ...pet.tipo, quantidade: 0, foto: null }
      especie.quantidade += 1
      especie.foto = especie.foto || pet.foto_url
      porTipo.set(pet.tipo_id, especie)
    }
    return [...porTipo.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [pets])

  const especie = especies.find((e) => e.id === tipoId)
  const petsDaEspecie = pets.filter((pet) => pet.tipo_id === tipoId)

  if (carregando) return <p>Carregando pets...</p>
  if (erro) return <p className="alerta-erro">{erro}</p>

  if (!especie) {
    return (
      <section>
        <h1>Encontre seu novo melhor amigo</h1>
        <p className="texto-suave">Escolha a espécie para ver os pets que aguardam um lar.</p>
        {especies.length === 0 ? (
          <p>No momento não há pets aguardando adoção.</p>
        ) : (
          <div className={styles.especies}>
            {especies.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`card ${styles.especie}`}
                onClick={() => setParams({ tipo: e.id })}
              >
                <img src={e.foto || SEM_FOTO} alt="" />
                <strong>{e.nome === 'Cachorro' ? 'Cachorros' : e.nome === 'Gato' ? 'Gatos' : e.nome}</strong>
                <span>{e.quantidade} {e.quantidade === 1 ? 'pet aguardando' : 'pets aguardando'} um lar</span>
              </button>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section>
      <div className={styles.topo}>
        <h1>{especie.nome === 'Cachorro' ? 'Cachorros' : especie.nome === 'Gato' ? 'Gatos' : especie.nome} para adoção</h1>
        <div className={styles.trocar}>
          {especies.filter((e) => e.id !== tipoId).map((e) => (
            <button key={e.id} type="button" className="botao-secundario" onClick={() => setParams({ tipo: e.id })}>
              Ver {e.nome === 'Cachorro' ? 'cachorros' : e.nome === 'Gato' ? 'gatos' : e.nome}
            </button>
          ))}
          <button type="button" className="botao-secundario" onClick={() => setParams({})}>
            Voltar à escolha
          </button>
        </div>
      </div>

      {petsDaEspecie.length === 0 ? (
        <p>Nenhum pet desta espécie aguardando adoção.</p>
      ) : (
        <div className="grade">
          {petsDaEspecie.map((pet) => (
            <article key={pet.id} className={`card ${styles.pet}`}>
              <img src={pet.foto_url || SEM_FOTO} alt={pet.nome} />
              <div className={styles.info}>
                <div className={styles.titulo}>
                  <h2>{pet.nome}</h2>
                  <span className={`selo selo-${pet.situacao}`}>{SITUACOES[pet.situacao]}</span>
                </div>
                <p className="texto-suave">
                  {pet.raca?.nome} · {formatarIdade(pet.idade_meses)} · Porte {PORTES[pet.porte]?.toLowerCase()}
                </p>
                {pet.situacao === 'RESERVADO' && (
                  <p className="texto-suave">Reservado: não recebe novos pedidos.</p>
                )}
                <Link to={`/pets/${pet.id}`} className="botao">Conhecer</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
