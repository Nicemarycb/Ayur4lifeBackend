const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create new coupon (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, validTo, description } = req.body;

    // Basic validation
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'Discount type must be percentage or fixed' });
    }

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({ error: 'Percentage discount must be between 1 and 100' });
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({ error: 'Fixed discount must be greater than 0' });
    }

    // Check if coupon code already exists
    const existingCoupon = await db.collection('coupons')
      .where('code', '==', code.toUpperCase())
      .get();

    if (!existingCoupon.empty) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const couponData = {
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      validTo: validTo ? new Date(validTo).toISOString() : null,
      description: description || '',
      isActive: true,
      usedCount: 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('coupons').add(couponData);

    res.status(201).json({
      message: 'Coupon created successfully',
      couponId: docRef.id
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Get all coupons (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const couponsSnapshot = await db.collection('coupons').orderBy('createdAt', 'desc').get();
    
    const coupons = [];
    couponsSnapshot.forEach(doc => {
      coupons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(coupons);
    
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Delete coupon (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('coupons').doc(id).delete();
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Toggle coupon status (admin only)
router.patch('/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const couponDoc = await db.collection('coupons').doc(id).get();
    if (!couponDoc.exists) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const currentStatus = couponDoc.data().isActive;
    await db.collection('coupons').doc(id).update({
      isActive: !currentStatus
    });

    res.json({ 
      message: `Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: !currentStatus
    });

  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({ error: 'Failed to toggle coupon status' });
  }
});

// Get available coupons for users (public route)
router.get('/available', async (req, res) => {
  try {
    const { orderAmount } = req.query;
    const minOrderAmount = orderAmount ? parseFloat(orderAmount) : 0;
    
    // Get all active coupons
    let couponsQuery = db.collection('coupons')
      .where('isActive', '==', true);
    
    const couponsSnapshot = await couponsQuery.get();
    
    const availableCoupons = [];
    const currentDate = new Date();
    
    couponsSnapshot.forEach(doc => {
      const coupon = doc.data();
      
      // Check if coupon is expired
      if (coupon.validTo && currentDate > new Date(coupon.validTo)) {
        return; // Skip expired coupons
      }
      
      // Check if order amount meets minimum requirement
      if (coupon.minOrderAmount && minOrderAmount < coupon.minOrderAmount) {
        return; // Skip coupons with minimum order requirements not met
      }
      
      // Calculate potential discount for display
      let potentialDiscount = 0;
      if (coupon.discountType === 'percentage') {
        potentialDiscount = (minOrderAmount * coupon.discountValue) / 100;
      } else {
        potentialDiscount = Math.min(coupon.discountValue, minOrderAmount);
      }
      
      availableCoupons.push({
        id: doc.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
        minOrderAmount: coupon.minOrderAmount || 0,
        validTo: coupon.validTo,
        potentialDiscount: Math.round(potentialDiscount * 100) / 100
      });
    });
    
    // Sort by discount value (highest first)
    availableCoupons.sort((a, b) => b.potentialDiscount - a.potentialDiscount);
    
    res.json(availableCoupons);
    
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch available coupons' });
  }
});

// Validate coupon for user (public route)
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({ error: 'Coupon code and order amount are required' });
    }

    // Find coupon
    const couponSnapshot = await db.collection('coupons')
      .where('code', '==', code.toUpperCase())
      .where('isActive', '==', true)
      .get();

    if (couponSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }

    const couponDoc = couponSnapshot.docs[0];
    const coupon = couponDoc.data();

    // Check if coupon is expired
    if (coupon.validTo && new Date() > new Date(coupon.validTo)) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        error: `Minimum order amount of ₹${coupon.minOrderAmount} required`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, orderAmount);
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    res.json({
      valid: true,
      coupon: {
        id: couponDoc.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
