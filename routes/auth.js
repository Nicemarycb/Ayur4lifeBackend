const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    try {
      await auth.getUserByEmail(email);
      return res.status(400).json({ error: 'User with this email already exists' });
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false
    });

    // Store additional user data in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      phone: phone || '',
      address: address || '',
       gender: req.body.gender || '',
       dateOfBirth: req.body.dateOfBirth || '',
      password: hashedPassword, // Store hashed password in Firestore
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userRecord.uid, 
        email, 
        role: 'user' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from Firestore by email
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password || '');
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userData.uid, 
        email: userData.email, 
        role: userData.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        uid: userData.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password; // Don't send password

    res.json({
      user: userData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// // Update User Profile
// router.put('/profile', authenticateToken, async (req, res) => {
//   try {
//     const { firstName, lastName, phone, address } = req.body;
//     const updates = {
//       firstName: firstName || req.user.firstName,
//       lastName: lastName || req.user.lastName,
//       phone: phone || '',
//       address: address || '',
//        gender: gender || '',
//        dateOfBirth: dateOfBirth || '',
//       updatedAt: new Date().toISOString()
//     };

//     await db.collection('users').doc(req.user.uid).update(updates);

//     res.json({
//       message: 'Profile updated successfully',
//       user: updates
//     });

//   } catch (error) {
//     console.error('Profile update error:', error);
//     res.status(500).json({ error: 'Failed to update profile', details: error.message });
//   }
// });

// Update User Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, gender, dateOfBirth } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (gender) updates.gender = gender;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await db.collection('users').doc(req.user.uid).update(updates);
    }

    res.json({
      message: 'Profile updated successfully',
      user: { ...req.user, ...updates }
    });

  } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// // Change Password
// router.put('/change-password', authenticateToken, async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ error: 'Current and new password are required' });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ error: 'New password must be at least 6 characters long' });
//     }

//     // Get current user data
//     const userDoc = await db.collection('users').doc(req.user.uid).get();
//     const userData = userDoc.data();

//     // Verify current password
//     const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
//     if (!isValidPassword) {
//       return res.status(401).json({ error: 'Current password is incorrect' });
//     }

//     // Hash new password
//     const hashedNewPassword = await bcrypt.hash(newPassword, 12);

//     // Update password in Firestore
//     await db.collection('users').doc(req.user.uid).update({
//       password: hashedNewPassword,
//       updatedAt: new Date().toISOString()
//     });

//     // Update password in Firebase Auth
//     await auth.updateUser(req.user.uid, {
//       password: newPassword
//     });

//     res.json({ message: 'Password changed successfully' });

//   } catch (error) {
//     console.error('Password change error:', error);
//     res.status(500).json({ error: 'Failed to change password', details: error.message });
//   }
// });
// Change Password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Verify current password against the hashed password from the database
    const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password and update it in Firestore only
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await db.collection('users').doc(req.user.uid).update({
      password: hashedNewPassword,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
});

module.exports = router;
