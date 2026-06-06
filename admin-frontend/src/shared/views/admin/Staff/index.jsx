import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BriefcaseBusiness,
    RefreshCw,
    Search,
    Trash2,
    Truck,
    UserPlus,
    Users,
} from "lucide-react";
import { adminService } from "../../../services/adminService";
import Loading from "../../../components/common/Loading";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const STAFF_LOGIN_ROLES = [
    { value: "seller", label: "Seller" },
    { value: "delivery", label: "Delivery" },
];

const roleMeta = {
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
};

const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [creatingStaff, setCreatingStaff] = useState(false);
    const [staffFormMessage, setStaffFormMessage] = useState(null);
    const [staffForm, setStaffForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "seller",
    });

    const staffUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return users
            .filter((user) => user.role === "seller" || user.role === "delivery")
            .filter((user) => {
                if (!term) return true;
                return (
                    user.name?.toLowerCase().includes(term) ||
                    user.email?.toLowerCase().includes(term) ||
                    user.phone?.toLowerCase().includes(term)
                );
            });
    }, [searchTerm, users]);

    const staffCount = users.filter((user) => user.role === "seller").length;
    const deliveryCount = users.filter((user) => user.role === "delivery").length;

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers();
            setUsers(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch staff users");
        } finally {
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

        return subscribeRealtimeDomains(["users"], () => refresh(false));
    }, [fetchUsers, refresh]);

    const handleStaffFormChange = (event) => {
        const { name, value } = event.target;
        setStaffForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateStaffLogin = async (event) => {
        event.preventDefault();
        setStaffFormMessage(null);

        try {
            setCreatingStaff(true);
            const payload = {
                ...staffForm,
                name: staffForm.name.trim(),
                email: staffForm.email.trim(),
                phone: staffForm.phone.trim(),
            };

            await adminService.createStaffLogin(payload);
            setStaffForm({
                name: "",
                email: "",
                phone: "",
                password: "",
                role: "seller",
            });
            setStaffFormMessage({ type: "success", text: "Staff login created successfully." });
            await refresh(false);
        } catch (err) {
            const serverMessage =
                err.response?.data?.message ||
                (typeof err.response?.data === "string" ? err.response.data : null) ||
                err.message ||
                "Failed to create staff login";

            setStaffFormMessage({ type: "error", text: serverMessage });
        } finally {
            setCreatingStaff(false);
        }
    };

    const handleRoleUpdate = async (userId, role) => {
        if (!role) return;

        try {
            await adminService.updateUserRole(userId, role);
            await refresh(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update staff role");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this staff login?")) {
            return;
        }

        try {
            await adminService.deleteUser(userId);
            await refresh(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete staff login");
        }
    };

    const renderRoleBadge = (role) => {
        const meta = roleMeta[role] || roleMeta.seller;
        const Icon = meta.Icon;

        return (
            <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${meta.className}`}>
                <Icon className="w-3 h-3 mr-1" />
                {meta.label}
            </span>
        );
    };

    if (loading) {
        return <Loading message="Loading staff..." />;
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
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Create and manage staff and delivery logins
                            </p>
                        </div>
                        <button
                            onClick={() => refresh(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50"
                            title="Refresh staff list"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Portal Accounts</p>
                                <p className="text-3xl font-bold text-gray-900">{staffCount + deliveryCount}</p>
                            </div>
                            <Users className="w-12 h-12 text-gray-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Staff Users</p>
                                <p className="text-3xl font-bold text-blue-600">{staffCount}</p>
                            </div>
                            <BriefcaseBusiness className="w-12 h-12 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Delivery Users</p>
                                <p className="text-3xl font-bold text-amber-600">{deliveryCount}</p>
                            </div>
                            <Truck className="w-12 h-12 text-amber-500" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleCreateStaffLogin} className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Create Staff Login</h2>
                            <p className="text-sm text-gray-500">
                                Add staff or delivery accounts that can sign in to the staff portal.
                            </p>
                        </div>
                    </div>
                    {staffFormMessage && (
                        <div
                            className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
                                staffFormMessage.type === "success"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                            }`}
                        >
                            {staffFormMessage.text}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <input
                            type="text"
                            name="name"
                            value={staffForm.name}
                            onChange={handleStaffFormChange}
                            placeholder="Full name"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            value={staffForm.email}
                            onChange={handleStaffFormChange}
                            placeholder="Email"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <input
                            type="tel"
                            name="phone"
                            value={staffForm.phone}
                            onChange={handleStaffFormChange}
                            placeholder="Phone"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="password"
                            name="password"
                            value={staffForm.password}
                            onChange={handleStaffFormChange}
                            placeholder="Password"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            minLength={6}
                        />
                        <div className="flex gap-3">
                            <select
                                name="role"
                                value={staffForm.role}
                                onChange={handleStaffFormChange}
                                className="min-w-0 flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {STAFF_LOGIN_ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                disabled={creatingStaff}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                            >
                                <UserPlus className="h-4 w-4" />
                                {creatingStaff ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search staff by name, email, or phone..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Staff
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
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
                                {staffUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No staff accounts found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    staffUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {user.name?.charAt(0).toUpperCase() || "S"}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.phone || "N/A"}
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
                                                        value={user.role}
                                                        onChange={(event) => handleRoleUpdate(user._id, event.target.value)}
                                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        title="Change staff role"
                                                    >
                                                        {STAFF_LOGIN_ROLES.map((role) => (
                                                            <option key={role.value} value={role.value}>
                                                                {role.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Staff Login"
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
            </div>
        </div>
    );
};

export default StaffManagement;
