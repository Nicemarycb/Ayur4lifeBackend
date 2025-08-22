// // const express = require('express');
// // const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken');
// // const { db } = require('../config/firebase');
// // const { authenticateToken, requireAdmin } = require('../middleware/auth');

// // const router = express.Router();

// // // Admin Login
// // router.post('/login', async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     if (!email || !password) {
// //       return res.status(400).json({ error: 'Email and password are required' });
// //     }

// //     // Get admin user from Firestore
// //     const adminSnapshot = await db.collection('users')
// //       .where('email', '==', email)
// //       .where('role', '==', 'admin')
// //       .limit(1)
// //       .get();

// //     if (adminSnapshot.empty) {
// //       return res.status(401).json({ error: 'Invalid credentials or not an admin' });
// //     }

// //     const adminDoc = adminSnapshot.docs[0];
// //     const adminData = adminDoc.data();

// //     // Verify password
// //     const isValidPassword = await bcrypt.compare(password, adminData.password || '');
// //     if (!isValidPassword) {
// //       return res.status(401).json({ error: 'Invalid credentials' });
// //     }

// //     // Generate JWT token
// //     const token = jwt.sign(
// //       { 
// //         uid: adminData.uid, 
// //         email: adminData.email, 
// //         role: 'admin' 
// //       },
// //       process.env.JWT_SECRET,
// //       { expiresIn: '7d' }
// //     );

// //     res.json({
// //       message: 'Admin login successful',
// //       token,
// //       admin: {
// //         uid: adminData.uid,
// //         email: adminData.email,
// //         firstName: adminData.firstName,
// //         lastName: adminData.lastName,
// //         role: adminData.role
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Admin login error:', error);
// //     res.status(500).json({ error: 'Login failed', details: error.message });
// //   }
// // });

// // // Verify Admin Token
// // router.get('/verify', authenticateToken, requireAdmin, async (req, res) => {
// //   try {
// //     const adminDoc = await db.collection('users').doc(req.user.uid).get();
    
// //     if (!adminDoc.exists) {
// //       return res.status(404).json({ error: 'Admin not found' });
// //     }

// //     const adminData = adminDoc.data();
// //     if (adminData.role !== 'admin') {
// //       return res.status(403).json({ error: 'Access denied' });
// //     }

// //     res.json({
// //       isAdmin: true,
// //       admin: {
// //         uid: adminData.uid,
// //         email: adminData.email,
// //         firstName: adminData.firstName,
// //         lastName: adminData.lastName,
// //         role: adminData.role
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Admin verification error:', error);
// //     res.status(500).json({ error: 'Verification failed', details: error.message });
// //   }
// // });

// // // Admin Dashboard Stats
// // router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
// //   try {
// //     // Get total users
// //     const usersSnapshot = await db.collection('users').get();
// //     const totalUsers = usersSnapshot.size;

// //     // Get total products
// //     const productsSnapshot = await db.collection('products').get();
// //     const totalProducts = productsSnapshot.size;

// //     // Get total orders
// //     const ordersSnapshot = await db.collection('orders').get();
// //     const totalOrders = ordersSnapshot.size;

// //     // Calculate total revenue
// //     let totalRevenue = 0;
// //     ordersSnapshot.forEach(doc => {
// //       const orderData = doc.data();
// //       if (orderData.status !== 'cancelled') {
// //         totalRevenue += orderData.total || 0;
// //       }
// //     });

// //     // Get order status breakdown
// //     const orderStatusBreakdown = {
// //       pending: 0,
// //       confirmed: 0,
// //       shipped: 0,
// //       delivered: 0,
// //       cancelled: 0
// //     };

// //     ordersSnapshot.forEach(doc => {
// //       const orderData = doc.data();
// //       const status = orderData.status || 'pending';
// //       if (orderStatusBreakdown[status] !== undefined) {
// //         orderStatusBreakdown[status]++;
// //       }
// //     });

// //     // Calculate today's revenue
// //     const today = new Date();
// //     today.setHours(0, 0, 0, 0);
// //     let todayRevenue = 0;
// //     ordersSnapshot.forEach(doc => {
// //       const orderData = doc.data();
// //       const orderDate = new Date(orderData.createdAt);
// //       if (orderDate >= today && orderData.status !== 'cancelled') {
// //         todayRevenue += orderData.total || 0;
// //       }
// //     });

// //     // Calculate this week's revenue
// //     const weekStart = new Date();
// //     weekStart.setDate(weekStart.getDate() - weekStart.getDay());
// //     weekStart.setHours(0, 0, 0, 0);
// //     let weekRevenue = 0;
// //     ordersSnapshot.forEach(doc => {
// //       const orderData = doc.data();
// //       const orderDate = new Date(orderData.createdAt);
// //       if (orderDate >= weekStart && orderData.status !== 'cancelled') {
// //         weekRevenue += orderData.total || 0;
// //       }
// //     });

// //     // Calculate this month's revenue
// //     const monthStart = new Date();
// //     monthStart.setDate(1);
// //     monthStart.setHours(0, 0, 0, 0);
// //     let monthRevenue = 0;
// //     ordersSnapshot.forEach(doc => {
// //       const orderData = doc.data();
// //       const orderDate = new Date(orderData.createdAt);
// //       if (orderDate >= monthStart && orderData.status !== 'cancelled') {
// //         monthRevenue += orderData.total || 0;
// //       }
// //     });

// //     // Calculate average order value
// //     const completedOrders = ordersSnapshot.docs.filter(doc => {
// //       const orderData = doc.data();
// //       return orderData.status !== 'cancelled';
// //     });
// //     const averageOrderValue = completedOrders.length > 0 
// //       ? totalRevenue / completedOrders.length 
// //       : 0;

// //     res.json({
// //       totalUsers,
// //       totalProducts,
// //       totalOrders,
// //       totalRevenue,
// //       orderStatusBreakdown,
// //       todayRevenue,
// //       weekRevenue,
// //       monthRevenue,
// //       averageOrderValue
// //     });

// //   } catch (error) {
// //     console.error('Dashboard stats error:', error);
// //     res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
// //   }
// // });

// // // Get a specific order by ID (for admin)
// // router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const orderDoc = await db.collection('orders').doc(id).get();

// //     if (!orderDoc.exists) {
// //       return res.status(404).json({ error: 'Order not found' });
// //     }

// //     res.json({ order: { id: orderDoc.id, ...orderDoc.data() } });

// //   } catch (error) {
// //     console.error('Admin get order error:', error);
// //     res.status(500).json({ error: 'Failed to fetch order', details: error.message });
// //   }
// // });

// // // Update an order's status (for admin)
// // router.patch('/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { status } = req.body;

// //     const orderRef = db.collection('orders').doc(id);
// //     await orderRef.update({
// //       status: status,
// //       updatedAt: new Date().toISOString()
// //     });

// //     res.json({ message: 'Order status updated successfully' });

// //   } catch (error) {
// //     console.error('Admin update order status error:', error);
// //     res.status(500).json({ error: 'Failed to update order status', details: error.message });
// //   }
// // });

// // // Update the /api/admin/orders route in admin.js
// // router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
// //   try {
// //     const { limit = 50, status, search, dateFrom, dateTo } = req.query;
    
// //     let query = db.collection('orders').orderBy('createdAt', 'desc');
    
// //     // Apply filters
// //     if (status && status !== 'all') {
// //       query = query.where('status', '==', status);
// //     }
    
// //     if (dateFrom) {
// //       const fromDate = new Date(dateFrom);
// //       query = query.where('createdAt', '>=', fromDate.toISOString());
// //     }
    
// //     if (dateTo) {
// //       const toDate = new Date(dateTo);
// //       toDate.setHours(23, 59, 59, 999);
// //       query = query.where('createdAt', '<=', toDate.toISOString());
// //     }
    
// //     const ordersSnapshot = await query.limit(parseInt(limit)).get();
    
// //     const orders = [];
    
// //     for (const doc of ordersSnapshot.docs) {
// //       const orderData = doc.data();
      
// //       // Get user data
// //       let userData = null;
// //       if (orderData.userId) {
// //         try {
// //           const userDoc = await db.collection('users').doc(orderData.userId).get();
// //           if (userDoc.exists) {
// //             userData = userDoc.data();
// //             // Remove sensitive information
// //             delete userData.password;
// //           }
// //         } catch (error) {
// //           console.error('Error fetching user data:', error);
// //         }
// //       }
      
// //       // Calculate item count and total
// //       const itemCount = orderData.items ? orderData.items.reduce((total, item) => total + item.quantity, 0) : 0;
      
// //       orders.push({
// //         id: doc.id,
// //         orderId: orderData.orderNumber || `#${doc.id.slice(-8)}`,
// //         userId: orderData.userId,
// //         user: userData,
// //         items: orderData.items || [],
// //         itemCount: itemCount,
// //         subtotal: orderData.subtotal || 0,
// //         total: orderData.finalAmount || orderData.total || 0,
// //         status: orderData.status || 'pending',
// //         shippingAddress: orderData.shippingAddress || {},
// //         paymentMethod: orderData.paymentMethod || '',
// //         createdAt: orderData.createdAt,
// //         updatedAt: orderData.updatedAt
// //       });
// //     }
    
// //     // Apply search filter if provided
// //     let filteredOrders = orders;
// //     if (search) {
// //       const searchTerm = search.toLowerCase();
// //       filteredOrders = orders.filter(order => 
// //         order.orderId.toLowerCase().includes(searchTerm) ||
// //         (order.user && (
// //           (order.user.firstName && order.user.firstName.toLowerCase().includes(searchTerm)) ||
// //           (order.user.lastName && order.user.lastName.toLowerCase().includes(searchTerm)) ||
// //           (order.user.email && order.user.email.toLowerCase().includes(searchTerm))
// //         ))
// //       );
// //     }
    
// //     res.json(filteredOrders);
    
// //   } catch (error) {
// //     console.error('Get orders error:', error);
// //     res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
// //   }
// // });

// // // Get all users (admin only)
// // router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
// //   try {
// //     const { limit = 50, page = 1 } = req.query;
    
// //     const usersSnapshot = await db.collection('users')
// //       .orderBy('createdAt', 'desc')
// //       .limit(parseInt(limit))
// //       .get();

// //     const users = [];
// //     usersSnapshot.forEach(doc => {
// //       const userData = doc.data();
// //       delete userData.password; // Don't send passwords
// //       users.push({
// //         id: doc.id,
// //         ...userData
// //       });
// //     });

// //     res.json({
// //       users,
// //       pagination: {
// //         currentPage: parseInt(page),
// //         totalItems: users.length,
// //         itemsPerPage: parseInt(limit)
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Get users error:', error);
// //     res.status(500).json({ error: 'Failed to fetch users', details: error.message });
// //   }
// // });

// // module.exports = router;

// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { db } = require('../config/firebase');
// const { authenticateToken, requireAdmin } = require('../middleware/auth');

// const router = express.Router();

// // Admin Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required' });
//     }

//     // Get admin user from Firestore
//     const adminSnapshot = await db.collection('users')
//       .where('email', '==', email)
//       .where('role', '==', 'admin')
//       .limit(1)
//       .get();

//     if (adminSnapshot.empty) {
//       return res.status(401).json({ error: 'Invalid credentials or not an admin' });
//     }

//     const adminDoc = adminSnapshot.docs[0];
//     const adminData = adminDoc.data();

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, adminData.password || '');
//     if (!isValidPassword) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { 
//         uid: adminData.uid, 
//         email: adminData.email, 
//         role: 'admin' 
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({
//       message: 'Admin login successful',
//       token,
//       admin: {
//         uid: adminData.uid,
//         email: adminData.email,
//         firstName: adminData.firstName,
//         lastName: adminData.lastName,
//         role: adminData.role
//       }
//     });

//   } catch (error) {
//     console.error('Admin login error:', error);
//     res.status(500).json({ error: 'Login failed', details: error.message });
//   }
// });

// // Verify Admin Token
// router.get('/verify', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const adminDoc = await db.collection('users').doc(req.user.uid).get();
    
//     if (!adminDoc.exists) {
//       return res.status(404).json({ error: 'Admin not found' });
//     }

//     const adminData = adminDoc.data();
//     if (adminData.role !== 'admin') {
//       return res.status(403).json({ error: 'Access denied' });
//     }

//     res.json({
//       isAdmin: true,
//       admin: {
//         uid: adminData.uid,
//         email: adminData.email,
//         firstName: adminData.firstName,
//         lastName: adminData.lastName,
//         role: adminData.role
//       }
//     });

//   } catch (error) {
//     console.error('Admin verification error:', error);
//     res.status(500).json({ error: 'Verification failed', details: error.message });
//   }
// });

// // Admin Dashboard Stats
// router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     // Get total users
//     const usersSnapshot = await db.collection('users').get();
//     const totalUsers = usersSnapshot.size;

//     // Get total products
//     const productsSnapshot = await db.collection('products').get();
//     const totalProducts = productsSnapshot.size;

//     // Get total orders
//     const ordersSnapshot = await db.collection('orders').get();
//     const totalOrders = ordersSnapshot.size;

//     // Calculate total revenue
//     let totalRevenue = 0;
//     ordersSnapshot.forEach(doc => {
//       const orderData = doc.data();
//       if (orderData.status !== 'cancelled') {
//         totalRevenue += orderData.total || 0;
//       }
//     });

//     // Get order status breakdown
//     const orderStatusBreakdown = {
//       pending: 0,
//       confirmed: 0,
//       shipped: 0,
//       delivered: 0,
//       cancelled: 0
//     };

//     ordersSnapshot.forEach(doc => {
//       const orderData = doc.data();
//       const status = orderData.status || 'pending';
//       if (orderStatusBreakdown[status] !== undefined) {
//         orderStatusBreakdown[status]++;
//       }
//     });

//     // Calculate today's revenue
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     let todayRevenue = 0;
//     ordersSnapshot.forEach(doc => {
//       const orderData = doc.data();
//       const orderDate = new Date(orderData.createdAt);
//       if (orderDate >= today && orderData.status !== 'cancelled') {
//         todayRevenue += orderData.total || 0;
//       }
//     });

//     // Calculate this week's revenue
//     const weekStart = new Date();
//     weekStart.setDate(weekStart.getDate() - weekStart.getDay());
//     weekStart.setHours(0, 0, 0, 0);
//     let weekRevenue = 0;
//     ordersSnapshot.forEach(doc => {
//       const orderData = doc.data();
//       const orderDate = new Date(orderData.createdAt);
//       if (orderDate >= weekStart && orderData.status !== 'cancelled') {
//         weekRevenue += orderData.total || 0;
//       }
//     });

//     // Calculate this month's revenue
//     const monthStart = new Date();
//     monthStart.setDate(1);
//     monthStart.setHours(0, 0, 0, 0);
//     let monthRevenue = 0;
//     ordersSnapshot.forEach(doc => {
//       const orderData = doc.data();
//       const orderDate = new Date(orderData.createdAt);
//       if (orderDate >= monthStart && orderData.status !== 'cancelled') {
//         monthRevenue += orderData.total || 0;
//       }
//     });

//     // Calculate average order value
//     const completedOrders = ordersSnapshot.docs.filter(doc => {
//       const orderData = doc.data();
//       return orderData.status !== 'cancelled';
//     });
//     const averageOrderValue = completedOrders.length > 0 
//       ? totalRevenue / completedOrders.length 
//       : 0;

//     res.json({
//       totalUsers,
//       totalProducts,
//       totalOrders,
//       totalRevenue,
//       orderStatusBreakdown,
//       todayRevenue,
//       weekRevenue,
//       monthRevenue,
//       averageOrderValue
//     });

//   } catch (error) {
//     console.error('Dashboard stats error:', error);
//     res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
//   }
// });

// // Get a specific order by ID (for admin)
// router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const orderDoc = await db.collection('orders').doc(id).get();

//     if (!orderDoc.exists) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     const orderData = orderDoc.data();

//     // Get user data
//     let user = null;
//     if (orderData.userId) {
//       try {
//         const userDoc = await db.collection('users').doc(orderData.userId).get();
//         if (userDoc.exists) {
//           user = userDoc.data();
//           // Remove sensitive information
//           delete user.password;
//         }
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       }
//     }

//     // Prepare order object similar to list
//     const preparedOrder = {
//       id: orderDoc.id,
//       orderId: orderData.orderNumber || `#${orderDoc.id.slice(-8).toUpperCase()}`,
//       userId: orderData.userId,
//       user: user,
//       items: orderData.items || [],
//       itemCount: orderData.items ? orderData.items.reduce((total, item) => total + item.quantity, 0) : 0,
//       subtotal: orderData.subtotal || 0,
//       gstAmount: orderData.gstAmount || 0,
//       discountAmount: orderData.discountAmount || 0,
//       total: orderData.finalAmount || orderData.total || 0,
//       finalAmount: orderData.finalAmount || 0,
//       status: orderData.status || 'pending',
//       shippingAddress: orderData.shippingAddress || {},
//       paymentMethod: orderData.paymentMethod || 'Unknown',
//       paymentDetails: orderData.paymentDetails || {},
//       createdAt: orderData.createdAt,
//       updatedAt: orderData.updatedAt,
//       // Include any other fields if needed
//       ...orderData  // Merge other fields
//     };

//     res.json(preparedOrder);

//   } catch (error) {
//     console.error('Admin get order error:', error);
//     res.status(500).json({ error: 'Failed to fetch order', details: error.message });
//   }
// });

// // Update an order's status (for admin)
// router.patch('/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const orderRef = db.collection('orders').doc(id);
//     await orderRef.update({
//       status: status,
//       updatedAt: new Date().toISOString()
//     });

//     res.json({ message: 'Order status updated successfully' });

//   } catch (error) {
//     console.error('Admin update order status error:', error);
//     res.status(500).json({ error: 'Failed to update order status', details: error.message });
//   }
// });

// // Update the /api/admin/orders route in admin.js
// router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { limit = 50, status, search, dateFrom, dateTo } = req.query;
    
//     let query = db.collection('orders').orderBy('createdAt', 'desc');
    
//     // Apply filters
//     if (status && status !== 'all') {
//       query = query.where('status', '==', status);
//     }
    
//     if (dateFrom) {
//       const fromDate = new Date(dateFrom);
//       query = query.where('createdAt', '>=', fromDate.toISOString());
//     }
    
//     if (dateTo) {
//       const toDate = new Date(dateTo);
//       toDate.setHours(23, 59, 59, 999);
//       query = query.where('createdAt', '<=', toDate.toISOString());
//     }
    
//     const ordersSnapshot = await query.limit(parseInt(limit)).get();
    
//     const orders = [];
    
//     for (const doc of ordersSnapshot.docs) {
//       const orderData = doc.data();
      
//       // Get user data
//       let userData = null;
//       if (orderData.userId) {
//         try {
//           const userDoc = await db.collection('users').doc(orderData.userId).get();
//           if (userDoc.exists) {
//             userData = userDoc.data();
//             // Remove sensitive information
//             delete userData.password;
//           }
//         } catch (error) {
//           console.error('Error fetching user data:', error);
//         }
//       }
      
//       // Calculate item count and total
//       const itemCount = orderData.items ? orderData.items.reduce((total, item) => total + item.quantity, 0) : 0;
      
//       orders.push({
//         id: doc.id,
//         orderId: orderData.orderNumber || `#${doc.id.slice(-8)}`,
//         userId: orderData.userId,
//         user: userData,
//         items: orderData.items || [],
//         itemCount: itemCount,
//         subtotal: orderData.subtotal || 0,
//         total: orderData.finalAmount || orderData.total || 0,
//         status: orderData.status || 'pending',
//         shippingAddress: orderData.shippingAddress || {},
//         paymentMethod: orderData.paymentMethod || '',
//         createdAt: orderData.createdAt,
//         updatedAt: orderData.updatedAt
//       });
//     }
    
//     // Apply search filter if provided
//     let filteredOrders = orders;
//     if (search) {
//       const searchTerm = search.toLowerCase();
//       filteredOrders = orders.filter(order => 
//         order.orderId.toLowerCase().includes(searchTerm) ||
//         (order.user && (
//           (order.user.firstName && order.user.firstName.toLowerCase().includes(searchTerm)) ||
//           (order.user.lastName && order.user.lastName.toLowerCase().includes(searchTerm)) ||
//           (order.user.email && order.user.email.toLowerCase().includes(searchTerm))
//         ))
//       );
//     }
    
//     res.json(filteredOrders);
    
//   } catch (error) {
//     console.error('Get orders error:', error);
//     res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
//   }
// });

// // Get all users (admin only)
// router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { limit = 50, page = 1 } = req.query;
    
//     const usersSnapshot = await db.collection('users')
//       .orderBy('createdAt', 'desc')
//       .limit(parseInt(limit))
//       .get();

//     const users = [];
//     usersSnapshot.forEach(doc => {
//       const userData = doc.data();
//       delete userData.password; // Don't send passwords
//       users.push({
//         id: doc.id,
//         ...userData
//       });
//     });

//     res.json({
//       users,
//       pagination: {
//         currentPage: parseInt(page),
//         totalItems: users.length,
//         itemsPerPage: parseInt(limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get users error:', error);
//     res.status(500).json({ error: 'Failed to fetch users', details: error.message });
//   }
// });

// module.exports = router;

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
        totalRevenue += orderData.finalAmount || orderData.total || 0;
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
        todayRevenue += orderData.finalAmount || orderData.total || 0;
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
        weekRevenue += orderData.finalAmount || orderData.total || 0;
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
        monthRevenue += orderData.finalAmount || orderData.total || 0;
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

// Get a specific order by ID (for admin)
router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderDoc.data();

    // Fetch user data using userId
    let user = null;
    if (orderData.userId) {
      const userDoc = await db.collection('users').doc(orderData.userId).get();
      if (userDoc.exists) {
        user = userDoc.data();
        // Remove sensitive information
        delete user.password;
      } else {
        console.warn(`User not found for userId: ${orderData.userId}`);
      }
    }

    // Prepare full order response with user and all relevant fields
    const fullOrder = {
      id: orderDoc.id,
      orderId: orderData.orderNumber || `#${orderDoc.id.slice(0, 8).toUpperCase()}`,
      userId: orderData.userId,
      user,  // Attached user object
      items: orderData.items || [],
      itemCount: orderData.totalItems || (orderData.items ? orderData.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
      subtotal: orderData.subtotal || 0,
      gstAmount: orderData.gstAmount || 0,
      discountAmount: orderData.discountAmount || 0,
      finalAmount: orderData.finalAmount || 0,
      total: orderData.finalAmount || orderData.subtotal || 0,  // Fallback for consistency
      status: orderData.status || 'pending',
      shippingAddress: orderData.shippingAddress || {},
      paymentMethod: orderData.paymentMethod || 'Unknown',
      paymentDetails: orderData.paymentDetails || {},
      couponCode: orderData.couponCode || null,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      // Include any other order fields if needed
    };

    res.json(fullOrder);

  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// Update an order's status (for admin)
router.patch('/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderRef = db.collection('orders').doc(id);
    await orderRef.update({
      status: status,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

// Get all orders (admin)
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, status, search, dateFrom, dateTo } = req.query;
    
    let query = db.collection('orders').orderBy('createdAt', 'desc');
    
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      query = query.where('createdAt', '>=', fromDate.toISOString());
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.where('createdAt', '<=', toDate.toISOString());
    }
    
    const ordersSnapshot = await query.limit(parseInt(limit)).get();
    
    const orders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      
      let userData = null;
      if (orderData.userId) {
        try {
          const userDoc = await db.collection('users').doc(orderData.userId).get();
          if (userDoc.exists) {
            userData = userDoc.data();
            delete userData.password;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      const itemCount = orderData.items ? orderData.items.reduce((total, item) => total + item.quantity, 0) : 0;
      
      orders.push({
        id: doc.id,
        orderId: orderData.orderNumber || `#${doc.id.slice(-8)}`,
        userId: orderData.userId,
        user: userData,
        items: orderData.items || [],
        itemCount: itemCount,
        subtotal: orderData.subtotal || 0,
        total: orderData.finalAmount || orderData.total || 0,
        status: orderData.status || 'pending',
        shippingAddress: orderData.shippingAddress || {},
        paymentMethod: orderData.paymentMethod || '',
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt
      });
    }
    
    let filteredOrders = orders;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredOrders = orders.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm) ||
        (order.user && (
          (order.user.firstName && order.user.firstName.toLowerCase().includes(searchTerm)) ||
          (order.user.lastName && order.user.lastName.toLowerCase().includes(searchTerm)) ||
          (order.user.email && order.user.email.toLowerCase().includes(searchTerm))
        ))
      );
    }
    
    res.json(filteredOrders);
    
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

// Get a specific user by ID (for admin)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password; // Don't send password

    res.json({
      id: userDoc.id,
      ...userData
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get a user's orders (for admin)
router.get('/users/:id/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const orders = [];
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      orders.push({
        id: doc.id,
        orderId: orderData.orderNumber || `#${doc.id.slice(-8).toUpperCase()}`,
        total: orderData.finalAmount || orderData.total || 0,
        status: orderData.status || 'pending',
        createdAt: orderData.createdAt,
        items: orderData.items || []  // For length in frontend
      });
    });

    res.json(orders);

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch user orders', details: error.message });
  }
});

module.exports = router;
