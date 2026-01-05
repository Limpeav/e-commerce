import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulated API call - replace with your actual API
    const fetchData = async () => {
      try {
        setLoading(true);
        // const res = await api.get("/admin/dashboard");
        // setStats(res.data);

        // Simulated data for demo
        setTimeout(() => {
          setStats({
            admin: "John Doe",
            users: 1234,
            products: 456,
            orders: 789,
            revenue: 45678.9,
            pendingOrders: 23,
            recentActivity: [
              { id: 1, action: "New order #1234", time: "2 min ago" },
              { id: 2, action: "Product added: iPhone 15", time: "15 min ago" },
              {
                id: 3,
                action: "User registered: jane@email.com",
                time: "1 hour ago",
              },
            ],
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.users?.toLocaleString() || "0",
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Total Products",
      value: stats.products?.toLocaleString() || "0",
      icon: Package,
      color: "bg-green-500",
      change: "+8%",
    },
    {
      title: "Total Orders",
      value: stats.orders?.toLocaleString() || "0",
      icon: ShoppingCart,
      color: "bg-purple-500",
      change: "+23%",
    },
    {
      title: "Revenue",
      value: `$${stats.revenue?.toLocaleString() || "0"}`,
      icon: DollarSign,
      color: "bg-yellow-500",
      change: "+15%",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {stats.admin}
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">
                      {stat.change}
                    </span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Orders
              </h2>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full">
                {stats.pendingOrders} New
              </span>
            </div>
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">
                {stats.pendingOrders}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Orders awaiting processing
              </p>
              <button className="mt-4 w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                View Orders
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {stats.recentActivity?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2">
              View All Activity →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/admin/product/list")}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <Package className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                Product List
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                Manage Users
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <ShoppingCart className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                View Orders
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all">
              <DollarSign className="w-8 h-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
