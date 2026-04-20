export class UserModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static validate(data) {
    const errors = [];
    if (!data.name?.trim()) errors.push("Name is required");
    if (!data.email?.trim()) errors.push("Email is required");
    if (!data.email?.includes("@")) errors.push("Invalid email format");
    if (!data.password || data.password.length < 6) errors.push("Password must be at least 6 characters");
    return { isValid: errors.length === 0, errors };
  }
}