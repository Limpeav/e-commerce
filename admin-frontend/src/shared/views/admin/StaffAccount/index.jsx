import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";
import { AuthController } from "../../../controllers";
import {
  getStoredAdminToken,
  getStoredAdminUser,
  persistAdminSession,
} from "../../../utils/adminSession";

const StaffAccount = () => {
  const storedUser = getStoredAdminUser();
  const [formData, setFormData] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    shift: storedUser?.shift || "morning",
  });
  const [loading, setLoading] = useState(!storedUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const submitHandler = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await AuthController.updateCurrentUser(formData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
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
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
              {storedUser?.role === "delivery" ? "Delivery" : "Seller"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-gray-950">My Information</h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              Update your own staff account details.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitHandler}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-xl font-black text-white">
              {formData.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-gray-950">{formData.name}</p>
              <p className="truncate text-sm font-semibold text-gray-500">{formData.email}</p>
            </div>
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

            {storedUser?.role === "seller" && (
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
      </div>
    </div>
  );
};

export default StaffAccount;
