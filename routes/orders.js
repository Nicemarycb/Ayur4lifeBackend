const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new order (checkout)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      shippingAddress, 
      paymentMethod, 
      paymentDetails,
      couponCode 
    } = req.body;

    // Get user's cart
    const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    if (cartSnapshot.empty) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const orderItems = [];
    let subtotal = 0;
    let totalItems = 0;

    // Process each cart item
    for (const doc of cartSnapshot.docs) {
      const cartItem = doc.data();
      const productDoc = await db.collection('products').doc(cartItem.productId).get();
      
      if (!productDoc.exists) {
        return res.status(400).json({ error: 'Product not found' });
      }

      const product = productDoc.data();
      
      // Check stock availability
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}` 
        });
      }

      const itemPrice = product.price + (product.gst || 0);
      const itemTotal = itemPrice * cartItem.quantity;
      
      orderItems.push({
        productId: cartItem.productId,
        productName: product.name,
        productImage: product.images?.[0] || '',
        quantity: cartItem.quantity,
        unitPrice: product.price,
        gst: product.gst || 0,
        itemTotal: itemTotal
      });

      subtotal += itemTotal;
      totalItems += cartItem.quantity;

      // Update product stock
      await productDoc.ref.update({
        stock: product.stock - cartItem.quantity,
        updatedAt: new Date().toISOString()
      });
    }

    // Calculate totals
    const gstAmount = subtotal * 0.18; // 18% GST
    const discountAmount = 0; // Apply coupon logic here if needed
    const finalAmount = subtotal + gstAmount - discountAmount;

    // Create order
    const orderData = {
      userId: req.user.uid,
      userEmail: req.user.email,
      items: orderItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      totalItems,
      shippingAddress: shippingAddress || {},
      paymentMethod,
      paymentDetails: paymentDetails || {},
      couponCode: couponCode || null,
      status: 'pending',
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orderRef = await db.collection('orders').add(orderData);

    // Clear cart after successful order
    const deletePromises = cartSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderRef.id,
      orderNumber: orderData.orderNumber,
      order: {
        id: orderRef.id,
        ...orderData
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    let query = db.collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc');
    
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(parseInt(limit)).offset(offset);
    
    const snapshot = await query.get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count
    const totalSnapshot = await db.collection('orders')
      .where('userId', '==', req.user.uid)
      .get();
    
    const total = totalSnapshot.size;
    
    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderDoc = await db.collection('orders').doc(id).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user owns this order or is admin
    if (order.userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    res.json({
      order: {
        id: orderDoc.id,
        ...order
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderDoc = await db.collection('orders').doc(id).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user owns this order
    if (order.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Check if order can be cancelled
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    
    // Update order status
    await orderDoc.ref.update({
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });
    
    // Restore product stock
    for (const item of order.items) {
      const productDoc = await db.collection('products').doc(item.productId).get();
      if (productDoc.exists) {
        const product = productDoc.data();
        await productDoc.ref.update({
          stock: product.stock + item.quantity,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    res.json({
      message: 'Order cancelled successfully',
      orderId: id
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order', details: error.message });
  }
});

// Track order
router.get('/:id/track', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderDoc = await db.collection('orders').doc(id).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user owns this order
    if (order.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get order tracking information
    const trackingDoc = await db.collection('orderTracking').doc(id).get();
    const tracking = trackingDoc.exists ? trackingDoc.data() : null;
    
    res.json({
      order: {
        id: orderDoc.id,
        ...order
      },
      tracking
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order', details: error.message });
  }
});

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AYUR${timestamp.slice(-6)}${random}`;
}

module.exports = router;
