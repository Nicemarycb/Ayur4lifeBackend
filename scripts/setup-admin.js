const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // Check if admin already exists
    const adminSnapshot = await db.collection('users')
      .where('email', '==', 'admin@ayur4life.com')
      .limit(1)
      .get();
    
    if (!adminSnapshot.empty) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminData = {
      uid: 'admin-' + Date.now(),
      email: 'admin@ayur4life.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'admin',
      phone: '',
      address: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to users collection
    await db.collection('users').doc(adminData.uid).set(adminData);
    
    console.log('Admin user created successfully!');
    console.log('Email: admin@ayur4life.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

// Run the setup
setupAdmin();
