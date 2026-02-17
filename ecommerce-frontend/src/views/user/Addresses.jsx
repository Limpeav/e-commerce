import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  MapPin,
  Plus,
  Save,
  Trash2,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import ProfileSidebar from "../../components/user/ProfileSidebar";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "../../services/http";
import { useAuth } from "../../context/AuthContext";

const API_URL = API_BASE_URL;

const emptyForm = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "Cambodia",
  isDefault: false,
};

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => getUserToken();

  const loadAddresses = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/users/addresses`, {
        headers: withAuthHeaders(token),
      });
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user, loadAddresses]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setError("Not authenticated");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        label: form.label || "Address",
      };

      const response = editingId
        ? await axios.put(`${API_URL}/users/addresses/${editingId}`, payload, {
            headers: {
              ...withAuthHeaders(token),
              "Content-Type": "application/json",
            },
          })
        : await axios.post(`${API_URL}/users/addresses`, payload, {
            headers: {
              ...withAuthHeaders(token),
              "Content-Type": "application/json",
            },
          });

      setAddresses(Array.isArray(response.data) ? response.data : []);
      setSuccess(editingId ? "Address updated" : "Address added");
      resetForm();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address) => {
    setEditingId(address._id);
    setForm({
      label: address.label || "",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      postalCode: address.postalCode || "",
      country: address.country || "Cambodia",
      isDefault: Boolean(address.isDefault),
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (addressId) => {
    const token = getToken();
    if (!token) {
      return;
    }

    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/users/addresses/${addressId}`, {
        headers: withAuthHeaders(token),
      });
      setAddresses(Array.isArray(response.data) ? response.data : []);
      setSuccess("Address deleted");
      if (editingId === addressId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (addressId) => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/users/addresses/${addressId}/default`,
        {},
        { headers: withAuthHeaders(token) }
      );
      setAddresses(Array.isArray(response.data) ? response.data : []);
      setSuccess("Default address updated");
    } catch (defaultError) {
      setError(defaultError.response?.data?.message || "Failed to set default address");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center bg-white p-10 rounded-[2rem] shadow-lg border border-stone-100">
          <AlertCircle className="w-14 h-14 text-red-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-main mb-3">Login Required</h2>
          <p className="text-text-muted mb-6">Please login to manage your addresses.</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-xl bg-text-main text-white font-bold text-sm hover:bg-primary-hover hover:text-text-main transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProfileSidebar />
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl border border-stone-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-text-main tracking-tight">Address Book</h1>
            </div>
            <p className="text-sm text-text-muted">
              Save delivery addresses for faster checkout.
            </p>
          </div>

          {(error || success) && (
            <div
              className={`rounded-2xl p-4 text-sm font-semibold border ${
                error
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-green-50 text-green-700 border-green-100"
              }`}
            >
              {error || success}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-stone-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-text-main mb-6">
              {editingId ? "Edit Address" : "Add New Address"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="label"
                  value={form.label}
                  onChange={handleInputChange}
                  placeholder="Label (e.g. Home)"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
                />
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
                />
                <input
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
                />
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleInputChange}
                  placeholder="Postal code"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
                />
                <input
                  name="country"
                  value={form.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleInputChange}
                placeholder="Address line 1"
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
              />
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleInputChange}
                placeholder="Address line 2 (optional)"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-primary"
              />

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-text-main">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                Set as default address
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-text-main text-white font-bold text-sm hover:bg-primary-hover hover:text-text-main transition-all disabled:opacity-60"
                >
                  {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {saving ? "Saving..." : editingId ? "Update Address" : "Add Address"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-3 rounded-xl border border-stone-200 text-text-main font-bold text-sm hover:border-primary hover:text-primary transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-stone-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-text-main mb-6">Saved Addresses</h2>

            {loading ? (
              <p className="text-text-muted text-sm">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-text-muted text-sm">No saved addresses yet.</p>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className="border border-stone-200 rounded-2xl p-5 bg-stone-50/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-bold text-text-main">
                            {address.label || "Address"}
                          </h3>
                          {address.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-text-main">{address.fullName}</p>
                        <p className="text-sm text-text-muted">{address.phone}</p>
                        <p className="text-sm text-text-muted mt-1">
                          {address.addressLine1}
                          {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                        </p>
                        <p className="text-sm text-text-muted">
                          {address.city}
                          {address.postalCode ? `, ${address.postalCode}` : ""}, {address.country}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address._id)}
                            className="px-3 py-2 rounded-lg text-xs font-bold border border-green-200 text-green-700 hover:bg-green-50 transition-all"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(address)}
                          className="p-2 rounded-lg border border-stone-200 text-text-main hover:border-primary hover:text-primary transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(address._id)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Addresses;
