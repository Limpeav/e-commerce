import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const AdminSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  // Get admin user data
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "null")

  const menuItems = [
    {
      path: '/admin',
      name: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/admin/products',
      name: 'Products',
      icon: Package
    },
    {
      path: '/admin/users',
      name: 'Users',
      icon: Users
    },
    {
      path: '/admin/orders',
      name: 'Orders',
      icon: ShoppingCart
    },
    {
      path: '/admin/reports',
      name: 'Reports',
      icon: BarChart3
    },
    {
      path: '/admin/reviews',
      name: 'Reviews',
      icon: MessageSquare
    }
  ]

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    navigate("/admin/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          {isSidebarOpen ? <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" /> : <Menu className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {adminUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">{adminUser?.name}</p>
                <p className="text-blue-300 text-sm font-medium">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 rounded-xl hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 group font-medium"
            >
              <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

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
