import { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
    BriefcaseBusiness,
    CheckCircle,
    Clock,
    Eye,
    EyeOff,
    Pencil,
    RefreshCw,
    Search,
    Trash2,
    Truck,
    UserPlus,
    Users,
    X,
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

const STAFF_LOGIN_ROLES = [
    { value: "seller", label: "Seller" },
    { value: "delivery", label: "Delivery" },
];

const SELLER_SHIFTS = [
    { value: "morning", label: "Morning Shift" },
    { value: "afternoon", label: "Afternoon Shift" },
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

const shiftMeta = {
    morning: {
        label: "Morning Shift",
        className: "bg-emerald-600 text-white",
    },
    afternoon: {
        label: "Afternoon Shift",
        className: "bg-violet-100 text-violet-800",
    },
};

const validateStrongPassword = (password = "") =>
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

const generateStrongPassword = () => {
    const requiredGroups = [
        "ABCDEFGHJKLMNPQRSTUVWXYZ",
        "abcdefghijkmnopqrstuvwxyz",
        "23456789",
        "!@#$%&*?",
    ];
    const allCharacters = requiredGroups.join("");
    const randomIndex = (length) => {
        const values = new Uint32Array(1);
        window.crypto.getRandomValues(values);
        return values[0] % length;
    };
    const characters = requiredGroups.map(
        (group) => group[randomIndex(group.length)]
    );

    while (characters.length < 16) {
        characters.push(allCharacters[randomIndex(allCharacters.length)]);
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
        const swapIndex = randomIndex(index + 1);
        [characters[index], characters[swapIndex]] = [
            characters[swapIndex],
            characters[index],
        ];
    }

    return characters.join("");
};

const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [creatingStaff, setCreatingStaff] = useState(false);
    const [staffFormMessage, setStaffFormMessage] = useState(null);
    const [showPasswordValidator, setShowPasswordValidator] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [savingStaff, setSavingStaff] = useState(false);
    const [editMessage, setEditMessage] = useState("");
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "seller",
        shift: "morning",
        password: "",
    });
    const [staffForm, setStaffForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "seller",
        shift: "morning",
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
                    user.phone?.toLowerCase().includes(term) ||
                    shiftMeta[user.shift]?.label.toLowerCase().includes(term)
                );
            });
    }, [searchTerm, users]);
    const staffSearchSuggestions = useMemo(
        () =>
            getMatchingSearchSuggestions(
                buildUserSearchSuggestionValues(
                    users.filter((user) => user.role === "seller" || user.role === "delivery")
                ),
                searchTerm,
                8
            ),
        [searchTerm, users]
    );
    const staffPagination = useAdminPagination({
        items: staffUsers,
        initialPageSize: 25,
        resetKey: searchTerm,
    });

    const staffCount = users.filter((user) => user.role === "seller").length;
    const deliveryCount = users.filter((user) => user.role === "delivery").length;
    const getPasswordRules = (password) => [
        {
            label: "Uppercase and lowercase letters",
            valid: /[a-z]/.test(password) && /[A-Z]/.test(password),
        },
        {
            label: "At least one number",
            valid: /\d/.test(password),
        },
        {
            label: "At least one special character",
            valid: /[^A-Za-z0-9]/.test(password),
        },
        {
            label: "At least 12 characters",
            valid: password.length >= 12,
        },
    ];
    const passwordRules = getPasswordRules(staffForm.password);
    const passedPasswordRules = passwordRules.filter((rule) => rule.valid).length;
    const passwordStrength = passedPasswordRules === passwordRules.length
        ? {
            label: "Strong",
            barClassName: "bg-emerald-500",
            textClassName: "text-emerald-600",
        }
        : passedPasswordRules >= 2
            ? {
                label: "Medium",
                barClassName: "bg-amber-400",
                textClassName: "text-amber-600",
            }
            : {
                label: "Weak",
                barClassName: "bg-rose-400",
                textClassName: "text-rose-600",
            };

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await UserController.getUsers();
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
        setStaffForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "role" && value === "seller" && !prev.shift
                ? { shift: "morning" }
                : {}),
        }));
    };

    const handleCreateStaffLogin = async (event) => {
        event.preventDefault();
        setStaffFormMessage(null);

        if (!validateStrongPassword(staffForm.password)) {
            setStaffFormMessage({
                type: "error",
                text: "Choose a strong password that meets every requirement.",
            });
            setShowPasswordValidator(true);
            return;
        }

        try {
            setCreatingStaff(true);
            const payload = {
                ...staffForm,
                name: staffForm.name.trim(),
                email: staffForm.email.trim(),
                phone: staffForm.phone.trim(),
                shift: staffForm.role === "seller" ? staffForm.shift : undefined,
            };

            await UserController.createStaff(payload);
            setStaffForm({
                name: "",
                email: "",
                phone: "",
                password: "",
                role: "seller",
                shift: "morning",
            });
            setStaffFormMessage({ type: "success", text: "Staff login created successfully." });
            setShowPassword(false);
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

    const useSuggestedPassword = () => {
        const password = generateStrongPassword();
        setStaffForm((current) => ({ ...current, password }));
        setShowPassword(true);
        setStaffFormMessage(null);
    };

    const closePasswordValidator = () => {
        if (!validateStrongPassword(staffForm.password)) {
            setStaffFormMessage({
                type: "error",
                text: "Complete all password requirements before continuing.",
            });
            return;
        }

        setShowPasswordValidator(false);
        setStaffFormMessage(null);
    };

    const openEditStaff = (user) => {
        setEditingStaff(user);
        setEditForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "seller",
            shift: user.role === "seller" ? user.shift || "morning" : "morning",
            password: "",
        });
        setShowPassword(false);
        setEditMessage("");
    };

    const closeEditStaff = () => {
        if (savingStaff) return;
        setEditingStaff(null);
        setEditMessage("");
    };

    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        setEditForm((current) => ({
            ...current,
            [name]: value,
            ...(name === "role" && value === "seller" && !current.shift
                ? { shift: "morning" }
                : {}),
        }));
        setEditMessage("");
    };

    const handleUpdateStaff = async (event) => {
        event.preventDefault();
        setEditMessage("");

        if (editForm.password && !validateStrongPassword(editForm.password)) {
            setEditMessage("Choose a strong password that meets every requirement.");
            return;
        }

        try {
            setSavingStaff(true);
            await UserController.updateStaff(editingStaff._id, {
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                phone: editForm.phone.trim(),
                role: editForm.role,
                shift: editForm.role === "seller" ? editForm.shift : undefined,
                password: editForm.password,
            });
            setEditingStaff(null);
            setStaffFormMessage({
                type: "success",
                text: "Staff information updated successfully.",
            });
            await refresh(false);
        } catch (err) {
            setEditMessage(
                err.response?.data?.message ||
                err.message ||
                "Failed to update staff information"
            );
        } finally {
            setSavingStaff(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this staff login?")) {
            return;
        }

        try {
            await UserController.delete(userId);
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

    const renderShiftBadge = (user) => {
        if (user.role !== "seller") {
            return <span className="text-sm text-gray-400">-</span>;
        }

        const meta = shiftMeta[user.shift] || shiftMeta.morning;

        return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold leading-5 ${meta.className}`}>
                <Clock className="mr-1 h-3 w-3" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
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
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={staffForm.password}
                            onChange={handleStaffFormChange}
                            onClick={() => {
                                setShowPasswordValidator(true);
                            }}
                            onFocus={() => {
                                setShowPasswordValidator(true);
                            }}
                            placeholder="Password"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            minLength={12}
                            autoComplete="new-password"
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
                        </div>
                        {staffForm.role === "seller" && (
                            <select
                                name="shift"
                                value={staffForm.shift}
                                onChange={handleStaffFormChange}
                                className="min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {SELLER_SHIFTS.map((shift) => (
                                    <option key={shift.value} value={shift.value}>
                                        {shift.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        <button
                            type="submit"
                            disabled={creatingStaff}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                            <UserPlus className="h-4 w-4" />
                            {creatingStaff ? "Adding..." : "Add"}
                        </button>
                    </div>
                </form>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            list="staff-search-suggestions"
                            placeholder="Search staff by name, email, or phone..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <datalist id="staff-search-suggestions">
                            {staffSearchSuggestions.map((suggestion) => (
                                <option key={suggestion} value={suggestion} />
                            ))}
                        </datalist>
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
                                        Shift
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
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No staff accounts found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    staffPagination.paginatedItems.map((user) => (
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderShiftBadge(user)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditStaff(user)}
                                                        className="rounded p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900"
                                                        title="Edit staff information"
                                                        aria-label={`Edit ${user.name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
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
                    <AdminPagination
                        {...staffPagination}
                        itemLabel="staff accounts"
                    />
                </div>
            </div>

            {editingStaff && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close edit staff form"
                        onClick={closeEditStaff}
                        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
                    />
                    <Motion.form
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        onSubmit={handleUpdateStaff}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-staff-title"
                        className="relative w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.55)] sm:p-8"
                    >
                        <button
                            type="button"
                            onClick={closeEditStaff}
                            disabled={savingStaff}
                            aria-label="Close edit staff form"
                            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="pr-10">
                            <h2 id="edit-staff-title" className="font-display text-2xl font-black text-gray-900">
                                Edit Staff Information
                            </h2>
                            <p className="mt-2 text-sm font-medium text-gray-500">
                                Update the account details for {editingStaff.name}.
                            </p>
                        </div>

                        {editMessage && (
                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {editMessage}
                            </div>
                        )}

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                                Full name
                                <input
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                    className="h-11 rounded-xl border border-gray-300 px-4 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    required
                                />
                            </label>
                            <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                                Role
                                <select
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleEditFormChange}
                                    className="h-11 rounded-xl border border-gray-300 px-4 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    {STAFF_LOGIN_ROLES.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {editForm.role === "seller" && (
                                <label className="grid gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
                                    Seller shift
                                    <select
                                        name="shift"
                                        value={editForm.shift}
                                        onChange={handleEditFormChange}
                                        className="h-11 rounded-xl border border-gray-300 px-4 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        {SELLER_SHIFTS.map((shift) => (
                                            <option key={shift.value} value={shift.value}>
                                                {shift.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <label className="grid gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
                                Email address
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditFormChange}
                                    autoComplete="off"
                                    className="h-11 rounded-xl border border-gray-300 px-4 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    required
                                />
                            </label>
                            <label className="grid gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
                                Phone number
                                <input
                                    type="tel"
                                    name="phone"
                                    value={editForm.phone}
                                    onChange={handleEditFormChange}
                                    className="h-11 rounded-xl border border-gray-300 px-4 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </label>
                            <label className="grid gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
                                New password
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={editForm.password}
                                        onChange={handleEditFormChange}
                                        placeholder="Leave blank to keep the current password"
                                        autoComplete="new-password"
                                        className="admin-neutral-autofill h-11 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 font-medium text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                    >
                                        {showPassword
                                            ? <EyeOff className="h-4 w-4" />
                                            : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </label>

                            {editForm.password && (
                                <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-bold text-gray-500">
                                            Password strength
                                        </span>
                                        <span className={`text-xs font-black ${
                                            validateStrongPassword(editForm.password)
                                                ? "text-emerald-600"
                                                : getPasswordRules(editForm.password).filter((rule) => rule.valid).length >= 2
                                                    ? "text-amber-600"
                                                    : "text-rose-600"
                                        }`}>
                                            {validateStrongPassword(editForm.password)
                                                ? "Strong"
                                                : getPasswordRules(editForm.password).filter((rule) => rule.valid).length >= 2
                                                    ? "Medium"
                                                    : "Weak"}
                                        </span>
                                    </div>

                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                validateStrongPassword(editForm.password)
                                                    ? "bg-emerald-500"
                                                    : getPasswordRules(editForm.password).filter((rule) => rule.valid).length >= 2
                                                        ? "bg-amber-400"
                                                        : "bg-rose-400"
                                            }`}
                                            style={{
                                                width: `${Math.max(
                                                    (getPasswordRules(editForm.password).filter((rule) => rule.valid).length / 4) * 100,
                                                    12
                                                )}%`,
                                            }}
                                        />
                                    </div>

                                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {getPasswordRules(editForm.password).map((rule) => (
                                            <li
                                                key={rule.label}
                                                className={`flex items-center gap-2 text-xs font-bold ${
                                                    rule.valid ? "text-emerald-600" : "text-gray-400"
                                                }`}
                                            >
                                                <CheckCircle
                                                    className={`h-4 w-4 shrink-0 ${
                                                        rule.valid ? "fill-emerald-500 text-white" : ""
                                                    }`}
                                                />
                                                {rule.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <p className="mt-4 text-xs font-semibold leading-relaxed text-gray-500">
                            Changing the email, role, or password signs this staff account out of its current session.
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeEditStaff}
                                disabled={savingStaff}
                                className="h-11 rounded-xl border border-gray-300 px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingStaff}
                                className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {savingStaff ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </Motion.form>
                </div>
            )}

            {showPasswordValidator && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close password validator"
                        onClick={() => setShowPasswordValidator(false)}
                        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
                    />
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="staff-password-validator-title"
                        className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-8"
                    >
                        <button
                            type="button"
                            onClick={() => setShowPasswordValidator(false)}
                            aria-label="Close password validator"
                            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="pr-8">
                            <h2
                                id="staff-password-validator-title"
                                className="font-display text-2xl font-black text-gray-900 sm:text-3xl"
                            >
                                Strong Staff Password
                            </h2>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                                The staff password must meet every security requirement below.
                            </p>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between gap-3">
                                <label
                                    htmlFor="staff-password-validator-input"
                                    className="text-sm font-black text-blue-600"
                                >
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={useSuggestedPassword}
                                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
                                >
                                    Use suggested password
                                </button>
                            </div>

                            <div className="relative mt-2">
                                <input
                                    id="staff-password-validator-input"
                                    autoFocus
                                    type={showPassword ? "text" : "password"}
                                value={staffForm.password}
                                onChange={(event) => {
                                    setStaffForm((current) => ({
                                        ...current,
                                        password: event.target.value,
                                    }));
                                    setStaffFormMessage(null);
                                    }}
                                    autoComplete="new-password"
                                    className="h-12 w-full border-0 border-b-2 border-blue-600 bg-transparent pr-12 text-lg font-bold text-gray-900 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                >
                                    {showPassword
                                        ? <EyeOff className="h-5 w-5" />
                                        : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[1.5rem] bg-gray-100/90 p-4 sm:p-5">
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClassName}`}
                                    style={{
                                        width: `${Math.max(
                                            (passedPasswordRules / passwordRules.length) * 100,
                                            staffForm.password ? 12 : 0
                                        )}%`,
                                    }}
                                />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                                <span className="text-sm font-bold text-gray-500">
                                    Password strength
                                </span>
                                <span className={`text-sm font-black ${passwordStrength.textClassName}`}>
                                    {passwordStrength.label}
                                </span>
                            </div>

                            <ul className="mt-4 space-y-3">
                                {passwordRules.map((rule) => (
                                    <li
                                        key={rule.label}
                                        className={`flex items-center gap-3 text-sm font-bold transition-colors ${
                                            rule.valid ? "text-emerald-600" : "text-gray-400"
                                        }`}
                                    >
                                        <CheckCircle
                                            className={`h-5 w-5 shrink-0 ${
                                                rule.valid ? "fill-emerald-500 text-white" : ""
                                            }`}
                                        />
                                        <span>{rule.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="button"
                            disabled={!validateStrongPassword(staffForm.password)}
                            onClick={closePasswordValidator}
                            className={`mt-6 flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.16em] transition-all ${
                                validateStrongPassword(staffForm.password)
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 hover:bg-blue-700"
                                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                            }`}
                        >
                            Continue
                        </button>
                    </Motion.div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
