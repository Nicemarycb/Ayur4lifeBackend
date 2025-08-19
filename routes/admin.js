const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get admin user from Firestore
    const adminSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials or not an admin' });
    }

    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminData.password || '');
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: adminData.uid, 
        email: adminData.email, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        uid: adminData.uid,
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: adminData.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Verify Admin Token
router.get('/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!adminDoc.exists) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminData = adminDoc.data();
    if (adminData.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      isAdmin: true,
      admin: {
        uid: adminData.uid,
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: adminData.role
      }
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

// Admin Dashboard Stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Get total products
    const productsSnapshot = await db.collection('products').get();
    const totalProducts = productsSnapshot.size;

    // Get total orders
    const ordersSnapshot = await db.collection('orders').get();
    const totalOrders = ordersSnapshot.size;

    // Calculate total revenue
    let totalRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      if (orderData.status !== 'cancelled') {
        totalRevenue += orderData.total || 0;
      }
    });

    // Get order status breakdown
    const orderStatusBreakdown = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const status = orderData.status || 'pending';
      if (orderStatusBreakdown[status] !== undefined) {
        orderStatusBreakdown[status]++;
      }
    });

    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const orderDate = new Date(orderData.createdAt);
      if (orderDate >= today && orderData.status !== 'cancelled') {
        todayRevenue += orderData.total || 0;
      }
    });

    // Calculate this week's revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    let weekRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const orderDate = new Date(orderData.createdAt);
      if (orderDate >= weekStart && orderData.status !== 'cancelled') {
        weekRevenue += orderData.total || 0;
      }
    });

    // Calculate this month's revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    let monthRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const orderDate = new Date(orderData.createdAt);
      if (orderDate >= monthStart && orderData.status !== 'cancelled') {
        monthRevenue += orderData.total || 0;
      }
    });

    // Calculate average order value
    const completedOrders = ordersSnapshot.docs.filter(doc => {
      const orderData = doc.data();
      return orderData.status !== 'cancelled';
    });
    const averageOrderValue = completedOrders.length > 0 
      ? totalRevenue / completedOrders.length 
      : 0;

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      orderStatusBreakdown,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      averageOrderValue
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Get recent orders
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const orders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      
      // Get user data
      let userData = null;
      if (orderData.userId) {
        try {
          const userDoc = await db.collection('users').doc(orderData.userId).get();
          if (userDoc.exists) {
            userData = userDoc.data();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      orders.push({
        id: doc.id,
        orderId: orderData.orderId || `#${doc.id.slice(-8)}`,
        userId: orderData.userId,
        user: userData ? {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        } : null,
        items: orderData.items || [],
        total: orderData.total || 0,
        status: orderData.status || 'pending',
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt
      });
    }

    res.json(orders);

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      delete userData.password; // Don't send passwords
      users.push({
        id: doc.id,
        ...userData
      });
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalItems: users.length,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

module.exports = router;
