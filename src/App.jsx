import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { authService } from './services/auth.js'
import Navbar from './components/Navbar.jsx'
import Login from './pages/Login.jsx'
import RapportList from './pages/RapportList.jsx'
import RapportCreate from './pages/RapportCreate.jsx'
import RapportDetail from './pages/RapportDetail.jsx'
import Settings from './pages/Settings.jsx'

function ProtectedLayout() {
  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/rapports" replace />} />
          <Route path="/rapports" element={<RapportList />} />
          <Route path="/rapports/nouveau" element={<RapportCreate />} />
          <Route path="/rapports/:id" element={<RapportDetail />} />
          <Route path="/parametres" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
