const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    const cartItems = [];
    let subtotal = 0;
    let totalItems = 0;

    for (const doc of cartSnapshot.docs) {
      const cartItem = doc.data();

      // Get product details
      const productDoc = await db.collection('products').doc(cartItem.productId).get();

      if (productDoc.exists) {
        const product = productDoc.data();

        // ✅ Use product.price only, GST will be added once at the end
        const itemTotal = (product.price || 0) * cartItem.quantity;

        cartItems.push({
          id: doc.id,
          product: {
            id: productDoc.id,
            ...product
          },
          quantity: cartItem.quantity,
          itemTotal: parseFloat(itemTotal.toFixed(2))
        });

        subtotal += itemTotal;
        totalItems += cartItem.quantity;
      } else {
        // Remove invalid cart item
        await doc.ref.delete();
      }
    }

    // Calculate SGST and CGST based on product rates
    let totalSgst = 0;
    let totalCgst = 0;
    
    for (const item of cartItems) {
      const itemSubtotal = item.itemTotal;
      const sgstRate = parseFloat(item.product.sgst || 0) / 100;
      const cgstRate = parseFloat(item.product.cgst || 0) / 100;
      
      totalSgst += itemSubtotal * sgstRate;
      totalCgst += itemSubtotal * cgstRate;
    }
    
    const totalGst = totalSgst + totalCgst;
    const finalAmount = subtotal + totalGst;

    res.json({
      cartItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      sgstAmount: parseFloat(totalSgst.toFixed(2)),
      cgstAmount: parseFloat(totalCgst.toFixed(2)),
      gstAmount: parseFloat(totalGst.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      totalItems
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart', details: error.message });
  }
});


// Add item to cart (updated to return full cartItems)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists and is active
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productDoc.data();
    if (!product.isActive) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const existingCartItemSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    let updatedQuantity = quantity;
    if (!existingCartItemSnapshot.empty) {
      const existingCartItem = existingCartItemSnapshot.docs[0];
      const existingData = existingCartItem.data();
      updatedQuantity = existingData.quantity + quantity;

      // Update existing item
      await existingCartItem.ref.update({
        quantity: updatedQuantity,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Add new item
      await db.collection('carts').add({
        userId: req.user.uid,
        productId,
        quantity,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Fetch updated cart items (full list)
    const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    const cartItems = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const doc of cartSnapshot.docs) {
      const cartItem = doc.data();
      
      // Get product details
      const prodDoc = await db.collection('products').doc(cartItem.productId).get();
      
      if (prodDoc.exists) {
        const prod = prodDoc.data();
        const itemTotal = prod.price * cartItem.quantity;
        
        cartItems.push({
          id: doc.id,
          product: {
            id: prodDoc.id,
            ...prod
          },
          quantity: cartItem.quantity,
          itemTotal: itemTotal
        });
        
        totalAmount += itemTotal;
        totalItems += cartItem.quantity;
      } else {
        // Remove invalid cart item
        await doc.ref.delete();
      }
    }

    // Calculate SGST and CGST based on product rates
    let totalSgst = 0;
    let totalCgst = 0;
    
    for (const item of cartItems) {
      const itemSubtotal = item.itemTotal;
      const sgstRate = parseFloat(item.product.sgst || 0) / 100;
      const cgstRate = parseFloat(item.product.cgst || 0) / 100;
      
      totalSgst += itemSubtotal * sgstRate;
      totalCgst += itemSubtotal * cgstRate;
    }
    
    const totalGst = totalSgst + totalCgst;
    const finalAmount = totalAmount + totalGst;

    res.json({
      message: 'Item added to cart successfully',
      updatedQuantity,
      cartItems,  // Return full updated cart
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalItems,
      sgstAmount: parseFloat(totalSgst.toFixed(2)),
      cgstAmount: parseFloat(totalCgst.toFixed(2)),
      gstAmount: parseFloat(totalGst.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart', details: error.message });
  }
});

// Update cart item quantity (updated to return full cartItems)
router.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const cartItemDoc = await db.collection('carts').doc(id).get();

    if (!cartItemDoc.exists) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItemDoc.data();

    if (cartItem.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Check product stock
    const productDoc = await db.collection('products').doc(cartItem.productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productDoc.data();
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Update quantity
    await cartItemDoc.ref.update({
      quantity,
      updatedAt: new Date().toISOString()
    });

    // Fetch updated cart items (full list)
    const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    const cartItems = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const doc of cartSnapshot.docs) {
      const updatedCartItem = doc.data();
      
      // Get product details
      const prodDoc = await db.collection('products').doc(updatedCartItem.productId).get();
      
      if (prodDoc.exists) {
        const prod = prodDoc.data();
        const itemTotal = prod.price * updatedCartItem.quantity;
        
        cartItems.push({
          id: doc.id,
          product: {
            id: prodDoc.id,
            ...prod
          },
          quantity: updatedCartItem.quantity,
          itemTotal: itemTotal
        });
        
        totalAmount += itemTotal;
        totalItems += updatedCartItem.quantity;
      } else {
        // Remove invalid cart item
        await doc.ref.delete();
      }
    }

    // Calculate SGST and CGST based on product rates
    let totalSgst = 0;
    let totalCgst = 0;
    
    for (const item of cartItems) {
      const itemSubtotal = item.itemTotal;
      const sgstRate = parseFloat(item.product.sgst || 0) / 100;
      const cgstRate = parseFloat(item.product.cgst || 0) / 100;
      
      totalSgst += itemSubtotal * sgstRate;
      totalCgst += itemSubtotal * cgstRate;
    }
    
    const totalGst = totalSgst + totalCgst;
    const finalAmount = totalAmount + totalGst;

    res.json({
      message: 'Cart item updated successfully',
      cartItems,  // Return full updated cart
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalItems,
      sgstAmount: parseFloat(totalSgst.toFixed(2)),
      cgstAmount: parseFloat(totalCgst.toFixed(2)),
      gstAmount: parseFloat(totalGst.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item', details: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get cart item
    const cartItemDoc = await db.collection('carts').doc(id).get();
    if (!cartItemDoc.exists) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItemDoc.data();
    if (cartItem.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Delete cart item
    await cartItemDoc.ref.delete();

 const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    const cartItems = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const doc of cartSnapshot.docs) {
      const updatedCartItem = doc.data();
      
      // Get product details
      const productDoc = await db.collection('products').doc(updatedCartItem.productId).get();
      
      if (productDoc.exists) {
        const product = productDoc.data();
        const itemTotal = product.price * updatedCartItem.quantity;
        
        cartItems.push({
          id: doc.id,
          product: {
            id: productDoc.id,
            ...product
          },
          quantity: updatedCartItem.quantity,
          itemTotal: itemTotal
        });
        
        totalAmount += itemTotal;
        totalItems += updatedCartItem.quantity;
      } else {
        // Remove invalid cart item
        await doc.ref.delete();
      }
    }

    // Calculate SGST and CGST based on product rates
    let totalSgst = 0;
    let totalCgst = 0;
    
    for (const item of cartItems) {
      const itemSubtotal = item.itemTotal;
      const sgstRate = parseFloat(item.product.sgst || 0) / 100;
      const cgstRate = parseFloat(item.product.cgst || 0) / 100;
      
      totalSgst += itemSubtotal * sgstRate;
      totalCgst += itemSubtotal * cgstRate;
    }
    
    const totalGst = totalSgst + totalCgst;
    const finalAmount = totalAmount + totalGst;

    res.json({
      message: 'Item removed from cart successfully',
      cartItemId: id,
      cartItems,  // Return updated cart items
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalItems,
      sgstAmount: parseFloat(totalSgst.toFixed(2)),
      cgstAmount: parseFloat(totalCgst.toFixed(2)),
      gstAmount: parseFloat(totalGst.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart', details: error.message });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    const deletePromises = cartSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    res.json({
      message: 'Cart cleared successfully',
      itemsRemoved: cartSnapshot.size
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart', details: error.message });
  }
});

// Get cart summary (for header display)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const cartSnapshot = await db.collection('carts')
      .where('userId', '==', req.user.uid)
      .get();

    let totalItems = 0;
    let totalAmount = 0;

    for (const doc of cartSnapshot.docs) {
      const cartItem = doc.data();
      const productDoc = await db.collection('products').doc(cartItem.productId).get();
      
      if (productDoc.exists) {
        const product = productDoc.data();
        totalItems += cartItem.quantity;
        // Calculate SGST and CGST for this item
        const sgstRate = parseFloat(product.sgst || 0) / 100;
        const cgstRate = parseFloat(product.cgst || 0) / 100;
        const itemSubtotal = product.price * cartItem.quantity;
        const itemSgst = itemSubtotal * sgstRate;
        const itemCgst = itemSubtotal * cgstRate;
        const itemGst = itemSgst + itemCgst;
        
        totalAmount += itemSubtotal + itemGst;
      }
    }

    res.json({
      totalItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    });

  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({ error: 'Failed to fetch cart summary', details: error.message });
  }
});

module.exports = router;
