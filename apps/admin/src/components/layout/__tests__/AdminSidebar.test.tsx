/**
 * @jest-environment jsdom
 */
/**
 * HU-079 — AdminSidebar responsive.
 * Cubre: navegación filtrada por rol, drawer hamburguesa (móvil) y expansión de grupos.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminSidebar from '../AdminSidebar'

jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
jest.mock('@stackframe/stack', () => ({ useStackApp: () => ({ signOut: jest.fn() }) }))

describe('AdminSidebar', () => {
  it('muestra la navegación y el logout para super_admin', () => {
    render(<AdminSidebar role="super_admin" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Catálogo')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })

  it('el menú hamburguesa abre/cierra el drawer (responsive)', () => {
    render(<AdminSidebar role="super_admin" />)
    const aside = screen.getByRole('complementary')
    // Cerrado en móvil: fuera de pantalla
    expect(aside.className).toContain('-translate-x-full')
    fireEvent.click(screen.getByLabelText('Abrir menú'))
    // Abierto: entra en pantalla
    expect(aside.className).not.toContain('-translate-x-full')
  })

  it('expande un grupo al hacer clic y muestra sus hijos', () => {
    render(<AdminSidebar role="super_admin" />)
    expect(screen.queryByText('Productos')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Catálogo/ }))
    expect(screen.getByText('Productos')).toBeInTheDocument()
    expect(screen.getByText('Categorías')).toBeInTheDocument()
  })

  it('oculta secciones sin permiso según el rol (vendedor no ve Configuración)', () => {
    render(<AdminSidebar role="vendedor" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Catálogo')).toBeInTheDocument()
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument()
  })
})
