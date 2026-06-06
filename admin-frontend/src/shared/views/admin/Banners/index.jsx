import { useCallback, useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { adminService } from "../../../services/adminService";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const emptyForm = {
  title: "",
  alt: "",
  sortOrder: "0",
  image: null,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const activeCount = useMemo(
    () => banners.filter((banner) => banner.isActive).length,
    [banners]
  );

  const loadBanners = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await adminService.getBanners();
      setBanners(response.data || []);
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to load banners");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
    return subscribeRealtimeDomains(
      ["banners"],
      () => loadBanners({ silent: true })
    );
  }, [loadBanners]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, image: file }));

    if (!file) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.image) {
      alert("Please choose a banner image");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("alt", form.alt);
    formData.append("sortOrder", form.sortOrder || "0");
    formData.append("image", form.image);

    try {
      setSaving(true);
      await adminService.createBanner(formData);
      setForm(emptyForm);
      setImagePreview(null);
      await loadBanners();
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to create banner");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner) => {
    const formData = new FormData();
    formData.append("title", banner.title || "");
    formData.append("alt", banner.alt || "");
    formData.append("sortOrder", String(banner.sortOrder || 0));
    formData.append("isActive", String(!banner.isActive));

    try {
      setUpdatingId(banner._id);
      await adminService.updateBanner(banner._id, formData);
      await loadBanners();
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to update banner");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (bannerId) => {
    const confirmed = window.confirm("Delete this banner?");
    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(bannerId);
      await adminService.deleteBanner(bannerId);
      await loadBanners();
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to delete banner");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Banner Manager</h1>
          <p className="mt-2 text-sm text-gray-500">
            Upload slider images from admin and control which banners appear on the home page.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add Banner</h2>
            <p className="mt-1 text-sm text-gray-500">
              Recommended banner size: 1600 x 700 or wider.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Banner preview"
                  className="h-56 w-full rounded-2xl object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="mb-3 h-12 w-12 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Click to upload banner image</span>
                  <span className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="Spring campaign"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Alt Text</label>
              <input
                type="text"
                value={form.alt}
                onChange={(event) => setForm((current) => ({ ...current, alt: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="Homepage hero banner"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Upload Banner"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Banners</h2>
              <p className="mt-1 text-sm text-gray-500">
                {activeCount} active of {banners.length} total
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : banners.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              No banners uploaded yet.
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {banners.map((banner) => {
                const isBusy = updatingId === banner._id;

                return (
                  <article key={banner._id} className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-50">
                    <img src={banner.image} alt={banner.alt || banner.title || "Banner"} className="h-52 w-full object-cover" />

                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{banner.title || "Untitled banner"}</h3>
                          <p className="mt-1 text-sm text-gray-500">{banner.alt || "No alt text provided"}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                          {banner.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">Sort order: {banner.sortOrder || 0}</div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(banner)}
                          disabled={isBusy}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {banner.isActive ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner._id)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
