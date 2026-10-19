import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Site/Home/Home.jsx'
import Pets from './pages/Site/Pets/Pets.jsx'
import PetDetalhe from './pages/Site/PetDetalhe/PetDetalhe.jsx'
import Login from './pages/Auth/Login/Login.jsx'
import Cadastro from './pages/Auth/Cadastro/Cadastro.jsx'
import MinhasAdocoes from './pages/Site/MinhasAdocoes/MinhasAdocoes.jsx'
import AdminLayout from './components/AdminLayout/AdminLayout.jsx'
import Processos from './pages/Admin/Processos/Processos/Processos.jsx'
import ProcessoDetalhe from './pages/Admin/Processos/ProcessoDetalhe/ProcessoDetalhe.jsx'
import PetsAdmin from './pages/Admin/Pets/PetsAdmin/PetsAdmin.jsx'
import PetForm from './pages/Admin/Pets/PetForm/PetForm.jsx'
import Lares from './pages/Admin/Lares/Lares/Lares.jsx'
import RotaProtegida from './components/RotaProtegida.jsx'
import useSessao from './services/useSessao'
import { ROLES } from './services/sessao'

// Proteção das rotas conforme o perfil de quem está logado (role "admin" ou "lar"):
//   - a Home é de visitantes e lares adotivos; a equipe vai direto para o painel;
//   - "Minhas adoções" é só do lar adotivo (sem login, vai para o login e volta depois);
//   - o painel /admin é só da equipe.
export default function App() {
  const { pathname } = useLocation()
  const sessao = useSessao()
  // o painel tem o próprio menu (AdminLayout)
  const telaAdmin = pathname.startsWith('/admin')

  return (
    <>
      {!telaAdmin && <Header />}
      <main>
        <Routes>
          {/* site */}
          <Route
            path="/"
            element={sessao?.role === ROLES.ADMIN ? <Navigate to="/admin/processos" replace /> : <Home />}
          />
          <Route path="/pets" element={<Pets />} />
          <Route path="/pets/:id" element={<PetDetalhe />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route
            path="/minhas-adocoes"
            element={<RotaProtegida roles={[ROLES.LAR]}><MinhasAdocoes /></RotaProtegida>}
          />

          {/* painel da equipe */}
          <Route
            path="/admin"
            element={<RotaProtegida roles={[ROLES.ADMIN]}><AdminLayout /></RotaProtegida>}
          >
            <Route index element={<Navigate to="processos" replace />} />
            <Route path="processos" element={<Processos />} />
            <Route path="processos/:id" element={<ProcessoDetalhe />} />
            <Route path="pets" element={<PetsAdmin />} />
            <Route path="pets/novo" element={<PetForm key="novo" />} />
            <Route path="pets/:id" element={<PetForm />} />
            <Route path="lares" element={<Lares />} />
            {/* o dossiê fica na própria listagem: o :id rola até o lar e abre o histórico dele */}
            <Route path="lares/:id" element={<Lares />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!telaAdmin && <Footer />}
    </>
  )
}
