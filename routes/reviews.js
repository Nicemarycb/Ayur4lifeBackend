const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Reviews route is working!' });
});

// Simple test endpoint
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'Reviews route ping successful',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// Debug endpoint to check database connection
router.get('/debug', async (req, res) => {
  try {
    const testDoc = await db.collection('products').limit(1).get();
    res.json({ 
      message: 'Database connection working',
      productsCount: testDoc.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Get reviews for a product (temporarily without auth for testing)
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Getting reviews for product:', productId);
    
    // Check if reviews collection exists and has data
    const reviewsSnapshot = await db.collection('reviews')
      .where('productId', '==', productId)
      .where('isActive', '==', true)
      .get();
    
    const reviews = [];
    
    // Fetch user names for each review
    for (const doc of reviewsSnapshot.docs) {
      const reviewData = doc.data();
      
      try {
        // Get user data to include name
        let userName = 'Customer';
        if (reviewData.userId) {
          const userDoc = await db.collection('users').doc(reviewData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData.name || userData.email?.split('@')[0] || 'Customer';
          }
        }
        
        reviews.push({
          id: doc.id,
          ...reviewData,
          userName: userName
        });
      } catch (error) {
        console.error(`Error fetching user data for review ${doc.id}:`, error);
        reviews.push({
          id: doc.id,
          ...reviewData,
          userName: 'Customer'
        });
      }
    }
    
    // Sort by creation date (newest first) on the client side
    reviews.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    console.log(`Found ${reviews.length} reviews for product ${productId}`);
    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    // If there's an error, return empty reviews array instead of 500
    res.json({ reviews: [] });
  }
});

// Error handler for this route
router.use((error, req, res, next) => {
  console.error('Reviews route error:', error);
  res.status(500).json({ 
    error: 'Reviews route error',
    message: error.message 
  });
});

// Add a new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Review submission request:', { body: req.body, user: req.user });
    
    const { productId, rating, comment } = req.body;
    const userId = req.user.uid;
    
    // Validate input
    if (!productId || !rating || rating < 1 || rating > 5) {
      console.log('Validation failed:', { productId, rating, comment });
      return res.status(400).json({ error: 'Invalid input. Rating must be 1-5' });
    }
    
    // Check if user has already reviewed this product
    const existingReview = await db.collection('reviews')
      .where('productId', '==', productId)
      .where('userId', '==', userId)
      .get();
    
    if (!existingReview.empty) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    
    // Check if user has purchased this product (for now, allow all authenticated users to review)
    // TODO: Implement proper purchase verification when order system is ready
    /*
    const orderSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .where('status', '==', 'delivered')
      .get();
    
    let hasPurchased = false;
    orderSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.items && order.items.some(item => item.productId === productId)) {
        hasPurchased = true;
      }
    });
    
    if (!hasPurchased) {
      return res.status(400).json({ error: 'You can only review products you have purchased' });
    }
    */
    
    // Get user name for the review
    let userName = 'Customer';
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName = userData.name || userData.email?.split('@')[0] || 'Customer';
      }
    } catch (error) {
      console.error('Error fetching user data for review creation:', error);
    }
    
    // Create review
    const reviewData = {
      productId,
      userId,
      userName: userName,
      rating: parseInt(rating),
      comment: comment || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const reviewRef = await db.collection('reviews').add(reviewData);
    
    // Update product rating
    await updateProductRating(productId);
    
    res.json({ 
      success: true, 
      message: 'Review added successfully',
      reviewId: reviewRef.id 
    });
    
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Update a review
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.uid;
    
    // Get the review
    const reviewDoc = await db.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const review = reviewDoc.data();
    
    // Check if user owns this review
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }
    
    // Get updated user name
    let userName = 'Customer';
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName = userData.name || userData.email?.split('@')[0] || 'Customer';
      }
    } catch (error) {
      console.error('Error fetching user data for review update:', error);
    }
    
    // Update review
    const updateData = {
      rating: parseInt(rating),
      comment: comment || '',
      userName: userName,
      updatedAt: new Date()
    };
    
    await db.collection('reviews').doc(reviewId).update(updateData);
    
    // Update product rating
    await updateProductRating(review.productId);
    
    res.json({ success: true, message: 'Review updated successfully' });
    
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.uid;
    
    // Get the review
    const reviewDoc = await db.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const review = reviewDoc.data();
    
    // Check if user owns this review
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    // Soft delete
    await db.collection('reviews').doc(reviewId).update({
      isActive: false,
      updatedAt: new Date()
    });
    
    // Update product rating
    await updateProductRating(review.productId);
    
    res.json({ success: true, message: 'Review deleted successfully' });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    // Check if product exists first
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      console.error(`Product ${productId} not found for rating update`);
      return;
    }

    const reviewsSnapshot = await db.collection('reviews')
      .where('productId', '==', productId)
      .where('isActive', '==', true)
      .get();
    
    let totalRating = 0;
    let reviewCount = 0;
    
    reviewsSnapshot.forEach(doc => {
      const review = doc.data();
      totalRating += review.rating;
      reviewCount++;
    });
    
    const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;
    
    // Update product with new rating
    await db.collection('products').doc(productId).update({
      rating: parseFloat(averageRating),
      reviewCount: reviewCount,
      updatedAt: new Date()
    });
    
    console.log(`Updated product ${productId} rating to ${averageRating} with ${reviewCount} reviews`);
    
  } catch (error) {
    console.error('Error updating product rating:', error);
    // Don't throw error, just log it to avoid breaking the review submission
  }
}

module.exports = router;
