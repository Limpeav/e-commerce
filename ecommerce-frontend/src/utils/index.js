// Utility Functions

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate required fields
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice, discountedPrice) => {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Generate slug from text
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// ============================================
// ECOMMERCE-SPECIFIC UTILITIES
// ============================================

// Get effective price (discountPrice if available and lower, otherwise regular price)
export const getEffectivePrice = (product) => {
  if (!product) return 0;
  return (product.discountPrice && product.discountPrice < product.price) 
    ? product.discountPrice 
    : product.price;
};

// Format as dual currency (USD + KHR)
export const formatDualCurrency = (amountUSD, exchangeRate) => {
  const usd = `$${Number(amountUSD || 0).toFixed(2)}`;
  const khr = exchangeRate ? `${Math.round(Number(amountUSD || 0) * exchangeRate).toLocaleString()} ៛` : null;
  return { usd, khr };
};

// Format dual currency as a single string
export const formatDualCurrencyString = (amountUSD, exchangeRate) => {
  const { usd, khr } = formatDualCurrency(amountUSD, exchangeRate);
  return khr ? `${usd} (≈ ${khr})` : usd;
};

// Calculate cart totals
export const calculateCartTotals = (cartItems, taxRate = 0.08, freeShippingThreshold = 0) => {
  const validItems = cartItems.filter(item => item.product);
  
  const subtotal = validItems.reduce(
    (acc, item) => acc + getEffectivePrice(item.product) * item.quantity,
    0
  );
  
  const tax = subtotal * taxRate;
  const shipping = subtotal >= freeShippingThreshold ? 0 : 0; // Free shipping
  const total = subtotal + tax + shipping;
  const itemCount = validItems.reduce((acc, item) => acc + item.quantity, 0);

  return {
    subtotal: roundToDecimal(subtotal, 2),
    tax: roundToDecimal(tax, 2),
    shipping: roundToDecimal(shipping, 2),
    total: roundToDecimal(total, 2),
    itemCount
  };
};

// Calculate tax
export const calculateTax = (amount, taxRate = 0.08) => {
  return roundToDecimal(amount * taxRate, 2);
};

// Round to decimal places
export const roundToDecimal = (number, decimals = 2) => {
  return parseFloat(Number(number).toFixed(decimals));
};

// Safe parse float
export const parseFloatSafe = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Validate phone number
export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

// Format address
export const formatAddress = (address) => {
  if (!address) return '';
  const parts = [];
  if (address.address) parts.push(address.address);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
};

// Get order status color classes
export const getOrderStatusColor = (status) => {
  const colors = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Processing: 'bg-blue-100 text-blue-800 border-blue-300',
    Shipped: 'bg-purple-100 text-purple-800 border-purple-300',
    Delivered: 'bg-green-100 text-green-800 border-green-300',
    Cancelled: 'bg-red-100 text-red-800 border-red-300',
    'Cash on Delivery': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Paid: 'bg-green-100 text-green-800 border-green-300',
    Unpaid: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// Get order status icon name (for use with icon libraries)
export const getOrderStatusIcon = (status) => {
  const icons = {
    Delivered: 'CheckCircle',
    Cancelled: 'XCircle',
    Pending: 'Clock',
    Processing: 'Package',
    Shipped: 'Truck',
  };
  return icons[status] || 'Package';
};

// Format order ID (show last 8 characters)
export const formatOrderId = (orderId) => {
  if (!orderId) return '';
  return `#${orderId.slice(-8).toUpperCase()}`;
};

// Get time ago (relative time)
export const getTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Validate credit card number (basic Luhn algorithm check)
export const validateCreditCard = (cardNumber) => {
  if (!cardNumber) return false;
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

// Mask credit card number (show only last 4 digits)
export const maskCreditCard = (cardNumber) => {
  if (!cardNumber) return '';
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return cardNumber;
  return `**** **** **** ${cleaned.slice(-4)}`;
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  return { valid: true, message: 'Password is strong' };
};

// Sort products
export const sortProducts = (products, sortBy = 'name', order = 'asc') => {
  const sorted = [...products];
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'price':
        aValue = getEffectivePrice(a);
        bValue = getEffectivePrice(b);
        break;
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      case 'name':
      case 'title':
        aValue = (a.title || a.name || '').toLowerCase();
        bValue = (b.title || b.name || '').toLowerCase();
        break;
      default:
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

// Filter products by category
export const filterProductsByCategory = (products, category) => {
  if (!category || category === 'all') return products;
  return products.filter(product => product.category === category);
};

// Search products
export const searchProducts = (products, searchTerm) => {
  if (!searchTerm) return products;
  const term = searchTerm.toLowerCase();
  return products.filter(product => 
    (product.title || product.name || '').toLowerCase().includes(term) ||
    (product.description || '').toLowerCase().includes(term) ||
    (product.category || '').toLowerCase().includes(term)
  );
};
