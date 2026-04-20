import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      if (!existingAdmin.isAdmin) {
        const salt = await bcrypt.genSalt(10);
        existingAdmin.password = await bcrypt.hash('admin123', salt);
        existingAdmin.isAdmin = true;
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Admin updated with isAdmin flag!');
      } else {
        console.log('Admin already exists:');
      }
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Check if user with phone exists, update to admin
    const existingPhone = await User.findOne({ phone: '1234567890' });
    if (existingPhone) {
      const salt = await bcrypt.genSalt(10);
      existingPhone.email = 'admin@gmail.com';
      existingPhone.password = await bcrypt.hash('admin123', salt);
      existingPhone.role = 'admin';
      existingPhone.isAdmin = true;
      await existingPhone.save();
      console.log('✅ Admin updated successfully!');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      phone: '1234567890',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin',
      isAdmin: true
    });

    await adminUser.save();
    
    console.log('✅ Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name: Admin User');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Go to: http://localhost:5173/admin/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();