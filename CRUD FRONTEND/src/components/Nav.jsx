// Nav.jsx define la barra de navegación visible en las páginas autenticadas.
import { Link } from 'react-router' // Link permite navegación interna sin recargar la página.

const Nav = () => {
  return (
    <nav className="bg-white text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-lg font-bold text-black">Sistemas post de temu</div>

        {/* Se usa una lista horizontal para los enlaces de navegación. */}
        <ul className="flex space-x-4">
          <li>
            <Link to="/home" className="text-black hover:text-indigo-700">
              Inicio
            </Link>
          </li>
          <li>
            <Link to="/post" className="text-black hover:text-indigo-700">
              Post
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Nav
