import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../../services/adminService'
import Loading from '../../../components/common/Loading'
import { getStoredAdminUser } from '../../../utils/adminSession'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const adminUser = getStoredAdminUser()
  const isDelivery = adminUser?.role === 'delivery'


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getDashboardStats()
        setStats(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Shipped': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      'Paid': 'bg-green-100 text-green-800 border-green-200',
      'Failed': 'bg-red-100 text-red-800 border-red-200',
      'Refunded': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }



  if (loading) {
    return <Loading message="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (isDelivery) {
    const recentDeliveryOrders = (stats?.recentActivity || []).filter(
      (activity) => activity.type === 'order'
    )
    const deliveryCards = [
      { label: 'Ready To Prepare', value: stats?.pendingOrders || 0, color: 'text-yellow-700', bg: 'bg-yellow-50' },
      { label: 'In Progress', value: stats?.processingOrders || 0, color: 'text-blue-700', bg: 'bg-blue-50' },
      { label: 'Out For Delivery', value: stats?.shippedOrders || 0, color: 'text-indigo-700', bg: 'bg-indigo-50' },
      { label: 'Cash To Collect', value: stats?.cashToCollect || 0, color: 'text-green-700', bg: 'bg-green-50' },
    ]

    return (
      <div className="min-h-screen bg-gray-50 px-4 pb-24 pt-20 sm:px-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">Delivery Hub</h1>
              <p className="mt-1 text-sm font-medium text-gray-500">
                View customer orders, open delivery locations, print summaries, and update delivery progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="inline-flex h-[52px] items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-black text-white hover:bg-blue-700"
            >
              Open Deliveries
            </button>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {deliveryCards.map((card) => (
              <div key={card.label} className={`${card.bg} rounded-2xl border border-gray-100 p-4 shadow-sm sm:p-5`}>
                <p className="text-xs font-black uppercase text-gray-600 sm:text-sm">{card.label}</p>
                <p className={`mt-2 truncate text-2xl font-black sm:text-3xl ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-black text-gray-950">Latest Orders</h2>
            </div>
            {recentDeliveryOrders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentDeliveryOrders.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => navigate(`/admin/orders/${activity.id}`)}
                      className="flex w-full flex-col gap-3 px-5 py-4 text-left hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-gray-950">
                          #{activity.id.slice(-8)} · {activity.userName || 'Customer'}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-500">
                          {activity.itemsCount || 0} item{activity.itemsCount === 1 ? '' : 's'} · {formatCurrency(activity.amount || 0)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(activity.orderStatus)}`}>
                          {activity.orderStatus || 'Pending'}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(activity.paymentStatus)}`}>
                          {activity.paymentStatus || 'Pending'}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-gray-500">No delivery activity yet</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Admin Dashboard</h1>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Sales</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.revenue || 0)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-green-600">{stats.orders || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.users || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Products</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.products || 0}</p>
              </div>
            </div>

            {/* Payment Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#f0fdf4] p-6 rounded-2xl shadow-lg border-2 border-[#bbf7d0]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#15803d] mb-1">Paid Orders</h3>
                    <p className="text-3xl font-bold text-[#15803d]">{stats.paidOrders || 0}</p>
                    <p className="text-xs text-[#16a34a] mt-1">
                      {stats.orders > 0 ? Math.round(((stats.paidOrders || 0) / stats.orders) * 100) : 0}% of total orders
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-[#bbf7d0] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#16a34a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-[#fef2f2] p-6 rounded-2xl shadow-lg border-2 border-[#fecaca]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#b91c1c] mb-1">Unpaid Orders</h3>
                    <p className="text-3xl font-bold text-[#b91c1c]">{stats.unpaidOrders || 0}</p>
                    <p className="text-xs text-[#dc2626] mt-1">
                      {stats.orders > 0 ? Math.round(((stats.unpaidOrders || 0) / stats.orders) * 100) : 0}% of total orders
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-[#fecaca] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={activity.id || `activity-${index}`}
                  className={`p-5 border-b ${index !== stats.recentActivity.length - 1 ? 'border-gray-100' : ''} hover:bg-gray-50 transition-all duration-150 cursor-pointer ${activity.type === 'order' ? 'hover:shadow-md' : ''}`}
                  onClick={() => {
                    if (activity.type === 'order') {
                      navigate(`/admin/orders/${activity.id}`)
                    } else if (activity.type === 'user') {
                      navigate(`/admin/users`)
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon & Avatar */}
                    <div className="flex-shrink-0">
                      {activity.type === 'order' ? (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.paymentStatus === 'Paid'
                            ? 'bg-green-100 ring-2 ring-green-300'
                            : activity.paymentStatus === 'Failed' || activity.paymentStatus === 'Refunded'
                              ? 'bg-red-100 ring-2 ring-red-300'
                              : 'bg-yellow-100 ring-2 ring-yellow-300'
                          }`}>
                          {activity.paymentStatus === 'Paid' ? (
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className={`w-6 h-6 ${activity.paymentStatus === 'Failed' || activity.paymentStatus === 'Refunded'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          )}
                        </div>
                      ) : activity.type === 'user' ? (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {getInitials(activity.userName)}
                          </span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{activity.action || 'Unknown action'}</p>
                            {activity.type === 'order' && (
                              <span className="text-xs text-gray-500 font-mono">#{activity.description?.replace('Order #', '') || activity.id?.slice(-6)}</span>
                            )}
                          </div>

                          {activity.type === 'order' ? (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{activity.userName}</span>
                                <span className="text-gray-400 mx-1">•</span>
                                <span>{activity.itemsCount || 0} item{activity.itemsCount !== 1 ? 's' : ''}</span>
                                <span className="text-gray-400 mx-1">•</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(activity.amount || 0)}</span>
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(activity.orderStatus)}`}>
                                  {activity.orderStatus || 'Pending'}
                                </span>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${getStatusColor(activity.paymentStatus)}`}>
                                  {activity.paymentStatus === 'Paid' ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Paid
                                    </>
                                  ) : activity.paymentStatus === 'Failed' ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Failed
                                    </>
                                  ) : activity.paymentStatus === 'Refunded' ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Refunded
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {activity.paymentStatus || 'Pending'}
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : activity.type === 'user' ? (
                            <div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{activity.userName}</span>
                                {activity.userEmail && (
                                  <>
                                    <span className="text-gray-400 mx-1">•</span>
                                    <span className="text-gray-500">{activity.userEmail}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">{activity.description || activity.userEmail}</p>
                          )}

                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {activity.time || 'Unknown time'}
                          </p>
                        </div>

                        {/* Type Badge */}
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full flex-shrink-0 ${activity.type === 'user' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          activity.type === 'product' ? 'bg-green-100 text-green-700 border border-green-200' :
                            activity.type === 'order' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                          {activity.type || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-lg text-center border border-gray-100">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-500">Activity will appear here once users start interacting with your store</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
