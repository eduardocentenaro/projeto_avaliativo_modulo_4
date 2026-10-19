import { Link } from 'react-router-dom'
import styles from './Home.module.css'

const PASSOS = [
  { icone: '🔎', titulo: 'Escolha', texto: 'Conheça os cães e gatos que aguardam um lar na nossa vitrine.' },
  { icone: '📝', titulo: 'Peça a adoção', texto: 'Cadastre seu lar e conte por que quer adotar o pet escolhido.' },
  { icone: '💬', titulo: 'Converse com a equipe', texto: 'Analisamos o pedido e fazemos uma entrevista para conhecer você.' },
  { icone: '🏡', titulo: 'Leve para casa', texto: 'Com o pedido aprovado, combinamos a entrega do seu novo amigo.' },
]

// Página inicial (visitantes e lares; a equipe é levada ao painel pelo App.jsx)
export default function Home() {
  function saibaMais() {
    document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className={styles.hero}>
        <div>
          <h1>Encontre seu Melhor Amigo</h1>
          <p>
            Cães e gatos resgatados esperam por um lar cheio de carinho. Adote com responsabilidade
            e transforme duas vidas: a dele e a sua.
          </p>
          <div className={styles.acoes}>
            <Link to="/pets" className="botao">Quero Adotar</Link>
            <button type="button" className="botao-secundario" onClick={saibaMais}>Saiba Mais</button>
          </div>
        </div>
        <span className={styles.emoji} aria-hidden="true">🐶🐱</span>
      </section>

      <section id="sobre" className={styles.secao}>
        <h2>Sobre o Lab365PetAmigo</h2>
        <p>
          Somos uma plataforma de adoção responsável que aproxima os pets resgatados pela ONG de
          lares interessados em adotá-los. Nosso objetivo é tornar o processo simples, transparente
          e seguro, priorizando a adoção certa para cada pet — e não apenas a mais rápida.
        </p>
      </section>

      <section className={styles.secao}>
        <h2>Como Funciona</h2>
        <div className={styles.passos}>
          {PASSOS.map((passo, i) => (
            <article key={passo.titulo} className="card">
              <span className={styles.icone}>{passo.icone}</span>
              <h3>{i + 1}. {passo.titulo}</h3>
              <p>{passo.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.secao} ${styles.chamada}`}>
        <h2>Pronto para Adotar?</h2>
        <p>Seu novo melhor amigo pode estar esperando por você agora mesmo.</p>
        <Link to="/pets" className="botao">Ver pets disponíveis</Link>
      </section>
    </>
  )
}
