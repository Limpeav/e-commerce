import { Package, Search, ShoppingBag, Heart } from 'lucide-react';
import { useLanguage } from '../../context/useLanguage';

export default function EmptyState({ 
  type = 'products', 
  message,
  actionText,
  onAction 
}) {
  const { t } = useLanguage();
  const displayMessage = message || t('empty.noItemsFound');
  const displayActionText = actionText || t('empty.browseProducts');

  const getIcon = () => {
    switch (type) {
      case 'products':
        return <Package className="w-16 h-16 text-gray-400" />;
      case 'search':
        return <Search className="w-16 h-16 text-gray-400" />;
      case 'cart':
        return <ShoppingBag className="w-16 h-16 text-gray-400" />;
      case 'wishlist':
        return <Heart className="w-16 h-16 text-gray-400" />;
      default:
        return <Package className="w-16 h-16 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center">
        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          {getIcon()}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {displayMessage}
        </h3>
        {onAction && (
          <button
            onClick={onAction}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            {displayActionText}
          </button>
        )}
      </div>
    </div>
  );
}
