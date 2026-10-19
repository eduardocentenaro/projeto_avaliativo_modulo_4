import { Link } from 'react-router-dom'

// Rodapé compartilhado pelas telas públicas do site
export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        🐾 <strong>Lab365PetAmigo</strong> — adoção responsável de cães e gatos
      </p>
      <p>
        <Link to="/">Home</Link> · <Link to="/pets">Pets para adoção</Link> · <Link to="/cadastro">Cadastre seu lar</Link>
      </p>
    </footer>
  )
}
