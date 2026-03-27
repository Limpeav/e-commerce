// User Model - Data structure and validation for user entities

export class UserModel {
  constructor(data = {}) {
    this._id = data._id || ''
    this.id = data.id || data._id || ''
    this.name = data.name || ''
    this.email = data.email || ''
    this.phone = data.phone || ''
    this.password = data.password || ''
    this.token = data.token || null
    this.role = data.role || 'user'
    this.avatar = data.avatar || ''
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.isActive = data.isActive !== undefined ? data.isActive : true
    this.emailVerified = data.emailVerified || false
  }

  // Validation rules
  static get validationRules() {
    return {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
        message: 'Name must be 2-50 characters and contain only letters'
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      },
      phone: {
        required: true,
        pattern: /^\+?[\d\s\-\(\)]+$/,
        minLength: 10,
        maxLength: 20,
        message: 'Please enter a valid phone number'
      },
      password: {
        required: true,
        minLength: 6,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: 'Password must be at least 6 characters with uppercase, lowercase, and number'
      },
      role: {
        required: true,
        enum: ['user', 'admin'],
        message: 'Role must be either user or admin'
      }
    }
  }

  // Validate user data
  static validate(userData) {
    const errors = []
    const rules = this.validationRules

    Object.keys(rules).forEach(field => {
      const rule = rules[field]
      const value = userData[field]

      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
        return
      }

      if (value && rule.minLength && value.length < rule.minLength) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rule.minLength} characters`)
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must not exceed ${rule.maxLength} characters`)
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message)
      }

      if (value && rule.enum && !rule.enum.includes(value)) {
        errors.push(rule.message)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Sanitize user data
  static sanitize(userData) {
    const sanitized = { ...userData }

    // Trim string fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim()
      }
    })

    // Remove sensitive fields for public display
    delete sanitized.password
    delete sanitized.emailVerified

    return sanitized
  }

  // Format user data for API
  toAPIFormat() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      avatar: this.avatar,
      address: this.address,
      token: this.token
    }
  }

  // Create user from API response
  static fromAPI(data) {
    return new UserModel(data)
  }

  // Check if user has specific role
  hasRole(role) {
    return this.role === role
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin')
  }

  // Get display name
  getDisplayName() {
    return this.name || this.email
  }

  // Get initials for avatar
  getInitials() {
    const name = this.name || this.email
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }
}

export default UserModel
