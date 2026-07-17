export const routeMeta = {
  "/": {
    title: "Home",
    description: "Shop the best baby and kids products at Cherish Baby Store. Discover curated essentials, toys, clothing, and more — delivered to your door.",
    ogType: "website",
  },
  "/customer": {
    title: "Home",
    description: "Shop the best baby and kids products at Cherish Baby Store. Discover curated essentials, toys, clothing, and more — delivered to your door.",
    ogType: "website",
  },
  "/products": {
    title: "All Products",
    description: "Browse our full collection of baby and kids products. From newborn essentials to toys and apparel — find everything your family needs.",
    ogType: "website",
  },
  "/deals": {
    title: "Deals & Discounts",
    description: "Save big on top-rated baby and kids products. Limited-time deals and discounts on Cherish Baby Store's best-sellers.",
    ogType: "website",
  },
  "/about": {
    title: "About Us",
    description: "Learn about Cherish Baby Store's mission to provide quality baby and kids products with exceptional service.",
    ogType: "website",
  },
  "/contact": {
    title: "Contact Us",
    description: "Get in touch with Cherish Baby Store's support team. We're here to help with orders, questions, and feedback.",
    ogType: "website",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "Read Cherish Baby Store's privacy policy to understand how we collect, use, and protect your personal data.",
    ogType: "website",
  },
  "/terms": {
    title: "Terms of Service",
    description: "Review the terms and conditions for using Cherish Baby Store's e-commerce platform and services.",
    ogType: "website",
  },
  "/knowledge-base": {
    title: "Knowledge Base",
    description: "Find helpful guides, FAQs, and resources about Cherish Baby Store products, orders, shipping, and returns.",
    ogType: "website",
  },
  "/location": {
    title: "Our Location",
    description: "Visit Cherish Baby Store's store or find our location. We serve families with quality baby and kids products.",
    ogType: "website",
  },
  "/login": {
    title: "Sign In",
    description: "Sign in to your Cherish Baby Store account to manage orders, track shipments, and save your favorites.",
    ogType: "website",
    noIndex: true,
  },
  "/register": {
    title: "Create Account",
    description: "Create a Cherish Baby Store account for faster checkout, order tracking, and personalized recommendations.",
    ogType: "website",
    noIndex: true,
  },
  "/cart": {
    title: "Shopping Cart",
    description: "Review your items, update quantities, and proceed to checkout securely.",
    ogType: "website",
    noIndex: true,
  },
  "/checkout": {
    title: "Checkout",
    description: "Complete your purchase securely. Fast checkout for all Cherish Baby Store customers.",
    ogType: "website",
    noIndex: true,
  },
  "/wishlist": {
    title: "Wishlist",
    description: "View your saved favorites and wishlist items on Cherish Baby Store.",
    ogType: "website",
    noIndex: true,
  },
  "/profile": {
    title: "My Profile",
    description: "Manage your Cherish Baby Store account profile, address book, and preferences.",
    ogType: "website",
    noIndex: true,
  },
  "/orders": {
    title: "My Orders",
    description: "Track and manage your Cherish Baby Store orders. View order history and delivery status.",
    ogType: "website",
    noIndex: true,
  },
  "/settings": {
    title: "Account Settings",
    description: "Update your Cherish Baby Store account settings, notifications, and preferences.",
    ogType: "website",
    noIndex: true,
  },
  "/forgot-password": {
    title: "Forgot Password",
    description: "Reset your Cherish Baby Store account password securely.",
    ogType: "website",
    noIndex: true,
  },
  "/reset-password": {
    title: "Reset Password",
    description: "Reset your Cherish Baby Store account password.",
    ogType: "website",
    noIndex: true,
  },
  "*": {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist. Browse our products or return home.",
    ogType: "website",
    noIndex: true,
  },
}

export const productMeta = {
  title: (name) => name,
  description: (name, brand) => `Shop ${name}${brand ? ` by ${brand}` : ""} at Cherish Baby Store. Quality baby and kids products with fast delivery.`,
  ogType: "product",
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cherish Baby Store",
  url: "https://cherishbabykhstore.store",
  logo: "https://cherishbabykhstore.store/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+855969888919",
    contactType: "customer service",
    email: "pichvisal.theam@gmail.com",
  },
  sameAs: [],
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cherish Baby Store",
  url: "https://cherishbabykhstore.store",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://cherishbabykhstore.store/products?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
}
