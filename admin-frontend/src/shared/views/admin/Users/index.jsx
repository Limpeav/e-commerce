import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Users,
    Search,
    Trash2,
    UserCheck,
    RefreshCw,
} from "lucide-react";
import { UserController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import AdminPagination from "../../../components/admin/AdminPagination";
import { useAdminPagination } from "../../../hooks/useAdminPagination";
import { subscribeRealtimeDomains } from "../../../services/realtime";
import {
    buildUserSearchSuggestionValues,
    getMatchingSearchSuggestions,
} from "../../../utils/searchSuggestions";

const roleMeta = {
    user: {
        label: "Customer",
        className: "bg-gray-100 text-gray-800",
        Icon: UserCheck,
    },
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const customerUsers = useMemo(
        () => users.filter((user) => (user.role || "user") === "user"),
        [users]
    );

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) {
            return customerUsers;
        }

        return customerUsers.filter(
            (user) =>
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)
            );
    }, [customerUsers, searchTerm]);
    const searchSuggestions = useMemo(
        () =>
            getMatchingSearchSuggestions(
                buildUserSearchSuggestionValues(customerUsers),
                searchTerm,
                8
            ),
        [customerUsers, searchTerm]
    );
    const customerPagination = useAdminPagination({
        items: filteredUsers,
        initialPageSize: 25,
        resetKey: searchTerm,
    });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const usersResponse = await UserController.getUsers();
            setUsers(usersResponse.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users");
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async (showSpinner = false) => {
        if (showSpinner) setRefreshing(true);
        await fetchUsers();
        if (showSpinner) setRefreshing(false);
    }, [fetchUsers]);

    useEffect(() => {
        queueMicrotask(() => {
            fetchUsers();
        });

        return subscribeRealtimeDomains(["users", "reviews"], () => refresh(false));
    }, [fetchUsers, refresh]);

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
                await UserController.delete(userId);
                await fetchUsers();
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
                                    Customer Management
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage customer accounts only
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {filteredUsers.length} Customers
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
                <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                list="customer-search-suggestions"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-[var(--color-primary)]"
                            />
                            <datalist id="customer-search-suggestions">
                                {searchSuggestions.map((suggestion) => (
                                    <option key={suggestion} value={suggestion} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-500">Total Customers</p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                    {customerUsers.length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[var(--color-primary-dark)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No customers found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    customerPagination.paginatedItems.map((user) => (
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
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-[#FECACA] bg-[#FFFFFF] px-3 py-2 text-sm font-semibold text-[#B42318] shadow-sm transition-all hover:border-[#B42318] hover:bg-[#B42318] hover:text-[#FFFFFF] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FECACA]"
                                                        title="Delete Customer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <AdminPagination
                        {...customerPagination}
                        itemLabel="customers"
                    />
                </div>

            </div>
        </div>
    );
};

export default UserManagement;
