const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlistSnapshot = await db.collection('wishlists')
      .where('userId', '==', req.user.uid)
      .get();

    const wishlistItems = [];

    for (const doc of wishlistSnapshot.docs) {
      const wishlistItem = doc.data();
      
      // Get product details
      const productDoc = await db.collection('products').doc(wishlistItem.productId).get();
      
      if (productDoc.exists) {
        const product = productDoc.data();
        wishlistItems.push({
          id: doc.id,
          product: {
            id: productDoc.id,
            ...product
          },
          addedAt: wishlistItem.addedAt
        });
      } else {
        // Remove invalid wishlist item
        await doc.ref.delete();
      }
    }

    res.json({
      wishlistItems,
      totalItems: wishlistItems.length
    });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist', details: error.message });
  }
});

// Add item to wishlist
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;

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

    // Check if item already exists in wishlist
    const existingWishlistItem = await db.collection('wishlists')
      .where('userId', '==', req.user.uid)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    if (!existingWishlistItem.empty) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    // Add to wishlist
    const wishlistItemData = {
      userId: req.user.uid,
      productId,
      addedAt: new Date().toISOString()
    };

    const docRef = await db.collection('wishlists').add(wishlistItemData);

    res.status(201).json({
      message: 'Product added to wishlist successfully',
      wishlistItemId: docRef.id
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add product to wishlist', details: error.message });
  }
});

// Remove item from wishlist
router.delete('/remove/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get wishlist item
    const wishlistItemDoc = await db.collection('wishlists').doc(id).get();
    if (!wishlistItemDoc.exists) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    const wishlistItem = wishlistItemDoc.data();
    if (wishlistItem.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Delete wishlist item
    await wishlistItemDoc.ref.delete();

    res.json({
      message: 'Product removed from wishlist successfully',
      wishlistItemId: id
    });

  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove product from wishlist', details: error.message });
  }
});

// Remove item from wishlist by product ID
router.delete('/remove-product/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Find wishlist item by product ID
    const wishlistItemSnapshot = await db.collection('wishlists')
      .where('userId', '==', req.user.uid)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    if (wishlistItemSnapshot.empty) {
      return res.status(404).json({ error: 'Product not found in wishlist' });
    }

    const wishlistItemDoc = wishlistItemSnapshot.docs[0];
    await wishlistItemDoc.ref.delete();

    res.json({
      message: 'Product removed from wishlist successfully',
      productId
    });

  } catch (error) {
    console.error('Remove product from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove product from wishlist', details: error.message });
  }
});

// Clear entire wishlist
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const wishlistSnapshot = await db.collection('wishlists')
      .where('userId', '==', req.user.uid)
      .get();

    const deletePromises = wishlistSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    res.json({
      message: 'Wishlist cleared successfully',
      itemsRemoved: wishlistSnapshot.size
    });

  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: 'Failed to clear wishlist', details: error.message });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItemSnapshot = await db.collection('wishlists')
      .where('userId', '==', req.user.uid)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    res.json({
      isWishlisted: !wishlistItemSnapshot.empty
    });

  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: 'Failed to check wishlist status', details: error.message });
  }
});

// Get wishlist count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const wishlistSnapshot = await db.collection('wishlists')
      .where('userId', '==', req.user.uid)
      .get();

    res.json({
      count: wishlistSnapshot.size
    });

  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({ error: 'Failed to get wishlist count', details: error.message });
  }
});

module.exports = router;
