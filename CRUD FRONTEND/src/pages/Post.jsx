// Products.jsx muestra la lista de productos y permite crear, editar y eliminar productos.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import Nav from '../components/Nav'
import PostForm from '../components/PostForm'
import ConfirmModal from '../components/ConfirmModal'

const Post = () => {
  // Estados que controla la lista de productos y su carga.
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const navigate = useNavigate()
  const token = localStorage.getItem('fakestore_token') || sessionStorage.getItem('fakestore_token')

  // Filtra productos según el texto de búsqueda en título, descripción o categoría.
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return true
    return [product.title, product.description]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

 

  // Cálculos de paginación.
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    // Si no hay token válido, redirige al login.
    if (!token) {
      navigate('/')
      return
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts')
        if (!response.ok) {
          throw new Error('Error al cargar los productos')
        }

        const data = await response.json()
        // Agrega la propiedad source para distinguir productos de la API de los locales.
        setProducts(data.map((product) => ({ ...product, source: 'api' })))
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los productos')
      } finally {
        setLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts')
        if (!response.ok) {
          throw new Error('Error al cargar las categorías')
        }

        const data = await response.json()
        setCategories(data)
      } catch (err) {
        console.warn(err)
      }
    }

    fetchProducts()
    fetchCategories()
  }, [navigate, token])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleEditProduct = async (productId) => {
    setProductError('')
    setLoadingProductDetail(true)

    const localProduct = products.find((product) => product.id === productId)
    // Si el producto ya está en el estado local, no vuelve a pedirlo a la API.
    if (localProduct) {
      setEditingProduct(localProduct)
      setShowProductForm(true)
      setLoadingProductDetail(false)
      return
    }

    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${productId}`)
      if (!response.ok) {
        throw new Error('Error al cargar el post')
      }

      const data = await response.json()
      setEditingProduct({ ...data, source: 'api' })
      setShowProductForm(true)
    } catch (err) {
      setProductError(err.message || 'No se pudo cargar el post')
    } finally {
      setLoadingProductDetail(false)
    }
  }

  const handleUpdateProduct = async (formData) => {
    setProductError('')
    setProductSuccess('')
    setProductSubmitting(true)

    const isLocalProduct = editingProduct?.source !== 'api'

    try {
      if (isLocalProduct) {
        // Actualiza directamente el producto local sin llamar a la API.
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? { ...p, ...formData, source: p.source || 'local' } : p
          )
        )
        setProductSuccess('Post actualizado correctamente.')
        setShowProductForm(false)
        setEditingProduct(null)
        return
      }

      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Error actualizando el post')
      }

      const data = await response.json()
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...data, source: 'api' } : p))
      )
      setProductSuccess('Post actualizado correctamente.')
      setShowProductForm(false)
      setEditingProduct(null)
      console.log('fakestore updated product:', data)
    } catch (err) {
      setProductError(err.message || 'No se pudo actualizar el post')
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    setProductToDelete(productId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    setProductError('')
    setProductSuccess('')
    setShowDeleteConfirm(false)

    try {
      const product = products.find((p) => p.id === productToDelete)
      if (product?.source !== 'api') {
        // Si el producto es local, simplemente lo eliminamos del estado.
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete))
        setProductSuccess('Post eliminado correctamente.')
        setProductToDelete(null)
        return
      }

      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${productToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Error eliminando post')
      }

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete))
      setProductSuccess('Post eliminado correctamente.')
      setProductToDelete(null)
    } catch (err) {
      setProductError(err.message || 'No se pudo eliminar el post')
      setProductToDelete(null)
    }
  }

  const cancelDeleteProduct = () => {
    setShowDeleteConfirm(false)
    setProductToDelete(null)
  }

  const [showProductForm, setShowProductForm] = useState(false)
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productError, setProductError] = useState('')
  const [productSuccess, setProductSuccess] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [loadingProductDetail, setLoadingProductDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  const handleCreateProduct = async (formData) => {
    setProductError('')
    setProductSuccess('')
    setProductSubmitting(true)

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Error creando post')
      }

      const data = await response.json()
      const newProduct = { ...data, source: 'local' }
      setProducts((prev) => [newProduct, ...(prev || [])])
      setProductSuccess('post creado correctamente. ID: ' + (newProduct.id || '—'))
      setShowProductForm(false)
      setEditingProduct(null)
      setCurrentPage(1)
    } catch (err) {
      setProductError(err.message || 'No se pudo crear el producto')
    } finally {
      setProductSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {token && <Nav />}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Post</h1>
            </div>
            <div className="flex items-center gap-4">
              
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null)
                    setShowProductForm((s) => !s)
                  }}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Nuevo post
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <label htmlFor="product-search" className="sr-only">Buscar posts</label>
            <input
              id="product-search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar post"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        {productError && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">{productError}</div>}
        {productSuccess && <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">{productSuccess}</div>}

        {showProductForm && (
          <PostForm
            initialData={editingProduct || {}}
            onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
            submitting={productSubmitting || loadingProductDetail}
            onClose={() => {
              setShowProductForm(false)
              setEditingProduct(null)
            }}
          />
        )}

        <ConfirmModal
          title="Confirmar eliminación"
          message="¿Estás seguro de que deseas eliminar este post? Esta acción no se puede deshacer."
          isOpen={showDeleteConfirm}
          isDangerous={true}
          onConfirm={confirmDeleteProduct}
          onCancel={cancelDeleteProduct}
        />

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
          

          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">Cargando posts...</div>
            ) : error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-6 text-rose-700">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Título</th>
                      <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Descripción</th>
                      <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {currentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 align-top text-sm text-slate-700 max-w-xl wrap-break-word">{product.title}</td>
                        <td className="px-6 py-4 align-top text-sm text-slate-600 max-w-2xl wrap-break-word">{product.description}</td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product.id)}
                              disabled={loadingProductDetail}
                              className="rounded-full w-full bg-black px-3 py-1 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                              Editar post
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="rounded-full w-full bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
                            >
                              Eliminar post
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rounded-2xl border border-slate-200 bg-black px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 text-white"
                    >
                      Anterior
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => handlePageChange(page)}
                          className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-2xl border border-slate-200 bg-black px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400  text-white"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
      </main>
    </div>
  )
}

export default Post
