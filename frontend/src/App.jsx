import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CargarCapa from './components/CargarCapa'
import Mapa from './components/Mapa'
import InfoCRS from './components/InfoCRS'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={Dashboard} />
        <Route path="/mapa" element={Mapa} />
        <Route path="/cargar-capa" element={CargarCapa} />
        <Route path="/info-crs" element={InfoCRS} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
