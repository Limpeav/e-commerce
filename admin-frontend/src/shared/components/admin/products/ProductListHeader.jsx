import { Images, Loader2, Mail, Plus } from "lucide-react";

const ProductListHeader = ({
  onAddBanner,
  onAddProduct,
  onSendPromotionEmails,
  promotionCount = 0,
  sendingPromotionEmails = false,
}) => (
  <div className="bg-white shadow-lg border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-main)]">
            Product Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage your inventory with ease</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSendPromotionEmails}
            disabled={sendingPromotionEmails || promotionCount === 0}
            className="flex items-center space-x-2 rounded-xl border border-green-600/35 bg-green-600 px-6 py-3 text-white shadow-sm shadow-green-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-green-700 hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-green-600/35 disabled:hover:bg-green-600"
            title={
              promotionCount === 0
                ? "Add discount prices before sending promotion emails"
                : "Email customers about current store promotions"
            }
          >
            {sendingPromotionEmails ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {sendingPromotionEmails
                ? "Sending..."
                : `Send Promotion Email${promotionCount ? ` (${promotionCount})` : ""}`}
            </span>
          </button>
          <button
            onClick={onAddBanner}
            className="flex items-center space-x-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-3 text-[var(--color-primary)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] hover:shadow-md"
          >
            <Images className="w-5 h-5" />
            <span className="font-semibold">Add Banner</span>
          </button>
          <button
            onClick={onAddProduct}
            className="flex items-center space-x-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-white transition-all duration-200 shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Product</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ProductListHeader;
