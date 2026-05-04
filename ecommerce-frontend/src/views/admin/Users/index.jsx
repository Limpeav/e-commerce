import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Users,
    Search,
    Shield,
    Trash2,
    UserCheck,
    RefreshCw,
    Truck,
    BriefcaseBusiness,
} from "lucide-react";
import { adminService } from "../../../services/adminService";
import Loading from "../../../components/common/Loading";

const ROLE_OPTIONS = [
    { value: "user", label: "User" },
    { value: "seller", label: "Seller" },
    { value: "delivery", label: "Delivery" },
    { value: "admin", label: "Admin" },
];

const roleMeta = {
    admin: {
        label: "Admin",
        className: "bg-green-100 text-green-800",
        Icon: Shield,
    },
    seller: {
        label: "Seller",
        className: "bg-blue-100 text-blue-800",
        Icon: BriefcaseBusiness,
    },
    delivery: {
        label: "Delivery",
        className: "bg-amber-100 text-amber-800",
        Icon: Truck,
    },
    user: {
        label: "User",
        className: "bg-gray-100 text-gray-800",
        Icon: UserCheck,
    },
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [stats, setStats] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) {
            return users;
        }

        return users.filter(
            (user) =>
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)
        );
    }, [searchTerm, users]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers();
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users");
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const response = await adminService.getUserStats();
            setStats(response.data);
        } catch (err) {
            console.error("Failed to fetch user stats", err);
        }
    }, []);

    const refresh = useCallback(async (showSpinner = false) => {
        if (showSpinner) setRefreshing(true);
        await Promise.all([fetchUsers(), fetchStats()]);
        if (showSpinner) setRefreshing(false);
    }, [fetchStats, fetchUsers]);

    useEffect(() => {
        queueMicrotask(() => {
            fetchUsers();
            fetchStats();
        });

        // Auto-refresh every 30 seconds so new registrations appear automatically
        const interval = setInterval(() => refresh(false), 30000);
        return () => clearInterval(interval);
    }, [fetchStats, fetchUsers, refresh]);

    const handleRoleUpdate = async (userId, newRole) => {
        if (!newRole) return;

        if (
            window.confirm(
                `Are you sure you want to change this user's role to ${newRole}?`
            )
        ) {
            try {
                await adminService.updateUserRole(userId, newRole);
                await fetchUsers();
                await fetchStats();
            } catch (err) {
                alert(err.response?.data?.message || "Failed to update user role");
            }
        }
    };

    const renderRoleBadge = (role = "user") => {
        const meta = roleMeta[role] || roleMeta.user;
        const Icon = meta.Icon;

        return (
            <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${meta.className}`}>
                <Icon className="w-3 h-3 mr-1" />
                {meta.label}
            </span>
        );
    };

    const handleDeleteUser = async (userId) => {
        if (
            window.confirm(
                "Are you sure you want to delete this user? This action cannot be undone."
            )
        ) {
            try {
                await adminService.deleteUser(userId);
                await fetchUsers();
                await fetchStats();
            } catch (err) {
                alert(err.response?.data?.message || "Failed to delete user");
            }
        }
    };

    if (loading) {
        return <Loading message="Loading users..." />;
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    User Management
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage user accounts and permissions
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {filteredUsers.length} Users
                                </span>
                            </div>
                            <button
                                onClick={() => refresh(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50"
                                title="Refresh user list"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {stats.totalUsers || 0}
                                </p>
                            </div>
                            <Users className="w-12 h-12 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Admin Users</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.adminUsers || 0}
                                </p>
                            </div>
                            <Shield className="w-12 h-12 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Regular Users</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {stats.regularUsers || 0}
                                </p>
                            </div>
                            <UserCheck className="w-12 h-12 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Staff Users</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.sellerUsers || stats.staffUsers || 0}
                                </p>
                            </div>
                            <BriefcaseBusiness className="w-12 h-12 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Delivery Users</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {stats.deliveryUsers || 0}
                                </p>
                            </div>
                            <Truck className="w-12 h-12 text-amber-500" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No users found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {user.name?.charAt(0).toUpperCase() || "U"}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={user.role || "user"}
                                                        onChange={(event) => handleRoleUpdate(user._id, event.target.value)}
                                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        title="Change role"
                                                    >
                                                        {ROLE_OPTIONS.map((role) => (
                                                            <option key={role.value} value={role.value}>
                                                                {role.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Users */}
                {stats.recentUsers && stats.recentUsers.length > 0 && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Recently Joined
                        </h2>
                        <div className="space-y-3">
                            {stats.recentUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold text-sm">
                                                {user.name?.charAt(0).toUpperCase() || "U"}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
