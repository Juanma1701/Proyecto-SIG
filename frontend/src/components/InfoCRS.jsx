export default function InfoCRS({ crs }) {
  if (!crs) return null
  return (
    <div style={{ background: '#f0f0f0', padding: 8, borderRadius: 4, fontSize: 13 }}>
      <strong>Sistema de referencia detectado:</strong>
      <p>EPSG:{crs.epsg ?? 'desconocido'}</p>
      <p style={{ opacity: 0.7 }}>Fuente: {crs.fuente}</p>
    </div>
  )
}