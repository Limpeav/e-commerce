// Product Model - Data structure and validation for product entities

export class ProductModel {
  constructor(data = {}) {
    this._id = data._id || ''
    this.name = data.name || data.title || ''
    this.title = data.title || data.name || ''
    this.description = data.description || ''
    this.price = data.price || 0
    this.discountPrice = data.discountPrice || null
    this.category = data.category || ''
    this.image = data.image || ''
    this.images = data.images || (data.image ? [data.image] : [])
    this.stock = data.stock || 0
    this.rating = data.rating || 0
    this.numReviews = data.numReviews || 0
    this.reviews = data.reviews || []
    this.brand = data.brand || ''
    this.sku = data.sku || ''
    this.tags = data.tags || []
    this.specifications = data.specifications || {}
    this.isActive = data.isActive !== undefined ? data.isActive : true
    this.isFeatured = data.isFeatured || false
    this.discount = data.discount || 0
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  // Validation rules
  static get validationRules() {
    return {
      name: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: 'Product name must be 3-100 characters'
      },
      description: {
        required: false,
        maxLength: 2000,
        message: 'Description must not exceed 2000 characters'
      },
      price: {
        required: true,
        min: 0,
        type: 'number',
        message: 'Price must be a positive number'
      },
      category: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: 'Category must be 2-50 characters'
      },
      stock: {
        required: true,
        min: 0,
        type: 'number',
        message: 'Stock must be a non-negative number'
      },
      rating: {
        required: false,
        min: 0,
        max: 5,
        type: 'number',
        message: 'Rating must be between 0 and 5'
      }
    }
  }

  // Validate product data
  static validate(productData) {
    const errors = []
    const rules = this.validationRules

    Object.keys(rules).forEach(field => {
      const rule = rules[field]
      const value = productData[field]

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
        return
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'number' && isNaN(value)) {
          errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`)
        }

        if (rule.minLength && value.toString().length < rule.minLength) {
          errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rule.minLength} characters`)
        }

        if (rule.maxLength && value.toString().length > rule.maxLength) {
          errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must not exceed ${rule.maxLength} characters`)
        }

        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rule.min}`)
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must not exceed ${rule.max}`)
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Calculate discounted price
  getDiscountedPrice() {
    if (this.discountPrice !== null && this.discountPrice !== undefined) {
      return this.discountPrice
    }
    if (this.discount > 0) {
      return this.price * (1 - this.discount / 100)
    }
    return this.price
  }

  // Get savings amount
  getSavings() {
    const discountedPrice = this.getDiscountedPrice()
    return this.price - discountedPrice
  }

  // Get discount percentage
  getDiscountPercentage() {
    if (this.discountPrice !== null && this.discountPrice !== undefined) {
      return Math.round(((this.price - this.discountPrice) / this.price) * 100)
    }
    return this.discount || 0
  }

  // Check if product is in stock
  isInStock() {
    return this.stock > 0 && this.isActive
  }

  // Check if product is on sale
  isOnSale() {
    return (this.discountPrice !== null && this.discountPrice !== undefined && this.discountPrice < this.price) || this.discount > 0
  }

  // Get stock status
  getStockStatus() {
    if (!this.isActive) return 'Inactive'
    if (this.stock === 0) return 'Out of Stock'
    if (this.stock < 10) return 'Low Stock'
    return 'In Stock'
  }

  // Format price
  formatPrice() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.getDiscountedPrice())
  }

  // Format rating
  formatRating() {
    return this.rating.toFixed(1)
  }

  // Get review summary
  getReviewSummary() {
    if (this.reviews.length === 0) {
      return { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let total = 0

    this.reviews.forEach(review => {
      const rating = Math.floor(review.rating)
      distribution[rating]++
      total += review.rating
    })

    return {
      average: total / this.reviews.length,
      total: this.reviews.length,
      distribution
    }
  }

  // Sanitize product data
  static sanitize(productData) {
    const sanitized = { ...productData }

    // Trim string fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim()
      }
    })

    return sanitized
  }

  // Create product from API response
  static fromAPI(data) {
    return new ProductModel(data)
  }

  // Convert to API format
  toAPIFormat() {
    return {
      name: this.name,
      title: this.title,
      description: this.description,
      price: this.price,
      category: this.category,
      image: this.image,
      images: this.images,
      stock: this.stock,
      brand: this.brand,
      sku: this.sku,
      tags: this.tags,
      specifications: this.specifications,
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      discount: this.discount,
      discountPrice: this.discountPrice
    }
  }

  // Search relevance score
  getSearchScore(query) {
    if (!query) return 0
    
    const queryLower = query.toLowerCase()
    const nameLower = this.name.toLowerCase()
    const descriptionLower = this.description.toLowerCase()
    const categoryLower = this.category.toLowerCase()

    let score = 0

    // Exact name match
    if (nameLower === queryLower) score += 100
    // Name contains query
    else if (nameLower.includes(queryLower)) score += 50
    // Category match
    else if (categoryLower.includes(queryLower)) score += 30
    // Description contains query
    else if (descriptionLower.includes(queryLower)) score += 20

    return score
  }
}

export default ProductModel
