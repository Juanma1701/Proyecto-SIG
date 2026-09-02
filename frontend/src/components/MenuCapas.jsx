import PanelCapas from "./PanelCapas"
import '../styles/MenuCapas.css'

function MenuCapas({ capas, setCapas }) {
  return (
    <aside className="menu-capas">
      <div className="menu-capas__header">
        <h3>Capas cargadas</h3>
      </div>

      <div className="menu-capas__content">
        <PanelCapas capas={capas} setCapas={setCapas} />
      </div>
    </aside>
  )
}

export default MenuCapas