import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Save,
  User,
} from "lucide-react";
import { AuthController } from "../../../controllers";
import {
  getStoredAdminToken,
  getStoredAdminUser,
  persistAdminSession,
} from "../../../utils/adminSession";

const PASSWORD_WORDS = [
  "Market",
  "River",
  "Green",
  "Cloud",
  "Order",
  "Parcel",
  "Store",
  "Route",
];

const generateSuggestedPassword = (role = "seller") => {
  const rolePrefix = role === "delivery" ? "Delivery" : "Seller";
  const word = PASSWORD_WORDS[Math.floor(Math.random() * PASSWORD_WORDS.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${rolePrefix}${word}${number}!`;
};

const StaffAccount = () => {
  const storedUser = getStoredAdminUser();
  const [formData, setFormData] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    shift: storedUser?.shift || "morning",
  });
  const [profileRole, setProfileRole] = useState(storedUser?.role || "seller");
  const [loading, setLoading] = useState(!storedUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [suggestedPassword, setSuggestedPassword] = useState(() =>
    generateSuggestedPassword(storedUser?.role || "seller")
  );
  const forgotPasswordPath =
    profileRole === "delivery" ? "/delivery/forgot-password" : "/seller/forgot-password";
  const accountBackPath =
    profileRole === "delivery" ? "/delivery/orders" : "/seller/dashboard";

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await AuthController.getCurrentUser();
        if (!isMounted) return;

        const profile = response.data || {};
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          shift: profile.shift || "morning",
        });
        const loadedRole = profile.role || "seller";
        setProfileRole(loadedRole);
        setSuggestedPassword(generateSuggestedPassword(loadedRole));
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load account information.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({ ...current, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const useSuggestedPassword = () => {
    setPasswordData((current) => ({
      ...current,
      newPassword: suggestedPassword,
      confirmPassword: suggestedPassword,
    }));
    setVisiblePasswords((current) => ({
      ...current,
      newPassword: true,
      confirmPassword: true,
    }));
    setPasswordError("");
  };

  const refreshSuggestedPassword = () => {
    setSuggestedPassword(generateSuggestedPassword(profileRole));
  };

  const copySuggestedPassword = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPassword);
      setPasswordError("");
      setPasswordSuccess("Suggested password copied.");
    } catch {
      setPasswordSuccess("");
      setPasswordError("Unable to copy password. You can type it manually.");
    }
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await AuthController.updateCurrentUser(formData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        setProfileRole(updatedUser.role || profileRole);
        persistAdminSession(getStoredAdminToken(updatedUser.role), {
          ...storedUser,
          ...updatedUser,
        });
      }

      setSuccess(response.data?.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const submitPasswordHandler = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      setChangingPassword(false);
      return;
    }

    try {
      const response = await AuthController.changeCurrentPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      const updatedUser = response.data?.user;
      const token = response.data?.token;

      if (updatedUser && token) {
        persistAdminSession(token, {
          ...getStoredAdminUser(updatedUser.role),
          ...updatedUser,
        });
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuggestedPassword(generateSuggestedPassword(profileRole));
      setPasswordSuccess(response.data?.message || "Password changed successfully.");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordFields = [
    {
      name: "currentPassword",
      label: "Current Password",
      autoComplete: "current-password",
    },
    {
      name: "newPassword",
      label: "New Password",
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword",
      label: "Confirm New Password",
      autoComplete: "new-password",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 font-bold text-gray-900 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          Loading account...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-white px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-2xl font-black text-white shadow-lg shadow-[var(--color-primary)]/20">
                  {formData.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
                    {profileRole === "delivery" ? "Delivery Account" : "Seller Account"}
                  </p>
                  <h1 className="mt-1 text-3xl font-black text-gray-950">My Information</h1>
                  <p className="mt-2 truncate text-sm font-semibold text-gray-500">
                    {formData.email || "Update your staff account details"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={accountBackPath}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-black text-gray-700">
                  <User className="h-4 w-4 text-[var(--color-primary)]" />
                  {formData.name || "Staff User"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2">
            <form onSubmit={submitHandler} className="p-5 sm:p-7 lg:border-r lg:border-gray-200">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-950">Profile Details</h2>
                <p className="mt-1 text-sm font-semibold text-gray-500">
                  Update your name, email address, and contact number.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm font-semibold text-green-700">{success}</p>
                </div>
              )}

              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-gray-900">Full Name</span>
                  <span className="relative block">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-semibold text-gray-900 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
                      required
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-gray-900">Email Address</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-semibold text-gray-900 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
                      required
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-gray-900">Phone Number</span>
                  <span className="relative block">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-semibold text-gray-900 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
                    />
                  </span>
                </label>

                {profileRole === "seller" && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-gray-900">Seller Shift</span>
                    <span className="relative block">
                      <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        value={formData.shift === "afternoon" ? "Afternoon Shift" : "Morning Shift"}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-base font-semibold text-gray-500 shadow-sm"
                        readOnly
                      />
                    </span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-black text-white shadow-lg shadow-[var(--color-primary)]/20 transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <form
              onSubmit={submitPasswordHandler}
              className="border-t border-gray-200 p-5 sm:p-7 lg:border-t-0"
            >
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-gray-950">Password & Security</h2>
                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    Change your password or reset it with an email OTP.
                  </p>
                </div>
                <Link
                  to={forgotPasswordPath}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-4 text-sm font-black text-[var(--color-primary-dark)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
                >
                  Forgot Password
                </Link>
              </div>

              {passwordError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm font-semibold text-red-700">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm font-semibold text-green-700">{passwordSuccess}</p>
                </div>
              )}

              <div className="mb-5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-gray-900">Suggested Password</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={refreshSuggestedPassword}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-primary-dark)] transition-colors hover:bg-white hover:text-[var(--color-primary)]"
                      title="Generate another password"
                      aria-label="Generate another password"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={copySuggestedPassword}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-primary-dark)] transition-colors hover:bg-white hover:text-[var(--color-primary)]"
                      title="Copy suggested password"
                      aria-label="Copy suggested password"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={useSuggestedPassword}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-primary)]/20 bg-white px-4 py-3 text-left transition-colors hover:border-[var(--color-primary)]"
                >
                  <span className="min-w-0 break-all font-mono text-sm font-black text-gray-900">
                    {suggestedPassword}
                  </span>
                  <span className="shrink-0 text-xs font-black uppercase text-[var(--color-primary-dark)]">
                    Use
                  </span>
                </button>
              </div>

              <div className="grid gap-5">
                {passwordFields.map((field) => (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-black text-gray-900">{field.label}</span>
                    <span className="relative block">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type={visiblePasswords[field.name] ? "text" : "password"}
                        name={field.name}
                        value={passwordData[field.name]}
                        onChange={handlePasswordChange}
                        autoComplete={field.autoComplete}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 text-base font-semibold text-gray-900 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.name)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        title={visiblePasswords[field.name] ? "Hide password" : "Show password"}
                        aria-label={visiblePasswords[field.name] ? "Hide password" : "Show password"}
                      >
                        {visiblePasswords[field.name] ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">
                Use at least 12 characters with uppercase, lowercase, number, and special character.
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-black text-white shadow-lg shadow-[var(--color-primary)]/20 transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
              >
                {changingPassword ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <KeyRound className="h-5 w-5" />
                )}
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAccount;
