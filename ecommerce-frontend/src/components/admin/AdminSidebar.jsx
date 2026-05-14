import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAdminSession, getPortalCashReportPath, getPortalDashboardPath, getPortalLoginPath, getPortalOrdersPath, getPortalPaymentQueuePath, getStoredAdminUser } from '../../utils/adminSession'
import { adminService } from '../../services/adminService'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileSpreadsheet,
  LogOut,
  Menu,
  BriefcaseBusiness,
  ReceiptText,
  WalletCards,
  Truck,
  X,
} from 'lucide-react'

const AdminSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [orderCount, setOrderCount] = React.useState(0)

  // Get admin user data
  const adminUser = getStoredAdminUser()
  const isDelivery = adminUser?.role === 'delivery'
  const dashboardPath = getPortalDashboardPath(adminUser)
  const ordersPath = getPortalOrdersPath(adminUser)
  const cashReportPath = getPortalCashReportPath(adminUser)
  const paymentQueuePath = getPortalPaymentQueuePath(adminUser)
  const isOrderDetail = /^\/(?:admin|seller|delivery)\/orders\/[^/]+/.test(location.pathname)

  const normalizeStatus = React.useCallback((status) => {
    if (!status) return ''

    const normalized = String(status).trim().toLowerCase()
    if (normalized === 'canceled' || normalized === 'cancelled') return 'cancelled'

    return normalized
  }, [])

  const getPendingOrderCount = React.useCallback((orders) => {
    if (!Array.isArray(orders)) return 0

    return orders.filter((order) => {
      const orderStatus = normalizeStatus(order?.orderStatus)
      const paymentStatus = normalizeStatus(order?.paymentStatus)

      if (isDelivery && !['processing', 'shipped'].includes(orderStatus)) {
        return false
      }

      const isFinishedOrder = orderStatus === 'delivered' || orderStatus === 'cancelled'
      const isSettledPayment =
        paymentStatus === 'paid' ||
        paymentStatus === 'refunded' ||
        paymentStatus === 'failed'

      return !isFinishedOrder || !isSettledPayment
    }).length
  }, [isDelivery, normalizeStatus])

  React.useEffect(() => {
    let isMounted = true

    const loadOrderCount = async () => {
      try {
        const response = await adminService.getOrders()
        if (isMounted) {
          setOrderCount(getPendingOrderCount(response.data))
        }
      } catch {
        if (isMounted) {
          setOrderCount(0)
        }
      }
    }

    loadOrderCount()
    const interval = window.setInterval(loadOrderCount, 30000)
    window.addEventListener('admin-orders-updated', loadOrderCount)

    return () => {
      isMounted = false
      window.clearInterval(interval)
      window.removeEventListener('admin-orders-updated', loadOrderCount)
    }
  }, [getPendingOrderCount])

  const menuItems = [
    {
      path: dashboardPath,
      name: 'Dashboard',
      icon: LayoutDashboard,
      hidden: adminUser?.role === 'delivery'
    },
    {
      path: '/admin/products',
      name: 'Products',
      icon: Package,
      adminOnly: true
    },
    {
      path: '/admin/products/csv-builder',
      name: 'CSV Builder',
      icon: FileSpreadsheet,
      adminOnly: true
    },
    {
      path: '/admin/users',
      name: 'Users',
      icon: Users,
      adminOnly: true
    },
    {
      path: ordersPath,
      name: adminUser?.role === 'delivery' ? 'Deliveries' : 'Orders',
      icon: adminUser?.role === 'delivery' ? Truck : ShoppingCart,
      badge: orderCount
    },
    {
      path: paymentQueuePath,
      name: 'Payment Queue',
      icon: WalletCards,
      hidden: adminUser?.role !== 'seller',
    },
    {
      path: cashReportPath,
      name: 'Cash Report',
      icon: ReceiptText,
      hidden: adminUser?.role === 'delivery',
    },
    {
      path: '/admin/staff',
      name: 'Staff',
      icon: BriefcaseBusiness,
      adminOnly: true
    }
  ].filter((item) => !item.hidden && (!item.adminOnly || adminUser?.role === 'admin'))

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return

    const loginPath = getPortalLoginPath(adminUser)
    clearAdminSession()
    navigate(loginPath)
  }

  return (
    <>
      {/* Mobile menu button */}
      {!isDelivery && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 rounded-xl bg-[var(--color-text-main)] text-white shadow-lg transition-all duration-200 group"
          >
            {isSidebarOpen ? <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" /> : <Menu className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />}
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-card)] transform transition-transform duration-300 ease-in-out shadow-xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] flex items-center justify-center border border-[var(--color-border)]">
                <LayoutDashboard className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-text-main)]">
                {adminUser?.role === 'admin'
                  ? 'Admin Panel'
                  : adminUser?.role === 'delivery'
                    ? 'Delivery Panel'
                    : 'Staff Panel'}
              </h1>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm bg-[var(--color-primary)]">
                <span className="text-white font-bold text-lg">
                  {adminUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-main)]">{adminUser?.name}</p>
                <p className="text-sm font-medium text-[var(--color-primary)]">
                  {adminUser?.role === 'admin'
                    ? 'Administrator'
                    : adminUser?.role === 'delivery'
                      ? 'Delivery'
                      : 'Staff'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.path ||
                (item.path === ordersPath && location.pathname.startsWith(`${ordersPath}/`)) ||
                (item.path === '/admin/products' &&
                  location.pathname.startsWith('/admin/products/') &&
                  location.pathname !== '/admin/products/csv-builder')

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-main)] hover:translate-x-1'
                    }
                  `}
                >
                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]'}`} />
                    {(item.name === 'Orders' || item.name === 'Deliveries') && item.badge > 0 && (
                      <span
                        className={`
                          absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none shadow-sm ring-2
                          ${isActive ? 'bg-[#ff8a8a] text-white ring-[var(--color-primary)]' : 'bg-[#ff7b7b] text-white ring-[var(--color-bg-card)]'}
                        `}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`font-medium ${isActive ? 'text-white' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)]'}`}>{item.name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {isActive && (
                      <div className="w-2 h-2 bg-[var(--color-secondary-light)] rounded-full animate-pulse" />
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 transition-all duration-200 group font-medium"
            >
              <LogOut className="h-5 w-5 text-[var(--color-text-muted)] group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {isDelivery && !isOrderDetail && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/95 px-3 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
            <Link
              to={ordersPath}
              className={`relative flex h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-black ${
                location.pathname === ordersPath
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Truck className="h-5 w-5" />
              Runs
              {orderCount > 0 && (
                <span className="absolute right-5 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7b7b] px-1 text-[9px] font-black leading-none text-white">
                  {orderCount > 99 ? '99+' : orderCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-black text-[var(--color-text-muted)]"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default AdminSidebar
