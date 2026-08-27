import '../styles/InfoCRS.css'

export default function InfoCRS({ crs }) {
  if (!crs) return null
  return (
    <div className="info-crs">
      <strong>Sistema de referencia detectado:</strong>
      <p>EPSG:{crs.epsg ?? 'desconocido'}</p>
      <p className="info-crs__fuente">Fuente: {crs.fuente}</p>
    </div>
  )
}