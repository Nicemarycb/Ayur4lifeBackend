const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const admin = require('firebase-admin');

// Get return policy (public)
router.get('/', async (req, res) => {
  try {
    const policyRef = admin.firestore().collection('returnPolicy').doc('default');
    const policyDoc = await policyRef.get();
    
    if (policyDoc.exists) {
      res.json({
        success: true,
        policy: policyDoc.data()
      });
    } else {
      // Return default policy if none exists
      const defaultPolicy = {
        returnWindow: 3,
        returnWindowUnit: 'days',
        allowReturns: true,
        nonReturnableCategories: ['food', 'perishables', 'personal-care'],
        returnConditions: [
          'Product must be in original packaging',
          'Product must be unused and undamaged',
          'Return request must be made within return window',
          'Food items and perishables are non-returnable',
          'Personal care items are non-returnable'
        ],
        refundMethod: 'original_payment',
        returnShipping: 'customer_pays',
        restockingFee: 0,
        returnAddress: {
          name: 'Ayur4Life Returns',
          address: '123 Returns Street',
          city: 'Return City',
          state: 'RC',
          zipCode: '12345',
          country: 'India'
        }
      };
      
      res.json({
        success: true,
        policy: defaultPolicy
      });
    }
  } catch (error) {
    console.error('Error fetching return policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return policy'
    });
  }
});

// Get return policy (admin)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const policyRef = admin.firestore().collection('returnPolicy').doc('default');
    const policyDoc = await policyRef.get();
    
    if (policyDoc.exists) {
      res.json({
        success: true,
        policy: policyDoc.data()
      });
    } else {
      // Return default policy if none exists, so admin can see and edit it
      const defaultPolicy = {
        returnWindow: 3,
        returnWindowUnit: 'days',
        allowReturns: true,
        nonReturnableCategories: ['food', 'perishables', 'personal-care'],
        returnConditions: [
          'Product must be in original packaging',
          'Product must be unused and undamaged',
          'Return request must be made within return window',
          'Food items and perishables are non-returnable',
          'Personal care items are non-returnable'
        ],
        refundMethod: 'original_payment',
        returnShipping: 'customer_pays',
        restockingFee: 0,
        returnAddress: {
          name: 'Ayur4Life Returns',
          address: '123 Returns Street',
          city: 'Return City',
          state: 'RC',
          zipCode: '12345',
          country: 'India'
        }
      };
      
      res.json({
        success: true,
        policy: defaultPolicy
      });
    }
  } catch (error) {
    console.error('Error fetching return policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return policy'
    });
  }
});

// Create/Update return policy (admin)
router.post('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const policyData = req.body;
    
    // Validate required fields
    if (!policyData.returnWindow || !policyData.returnWindowUnit) {
      return res.status(400).json({
        success: false,
        message: 'Return window and unit are required'
      });
    }
    
    // Add timestamp
    policyData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    policyData.updatedBy = req.user.uid;
    
    const policyRef = admin.firestore().collection('returnPolicy').doc('default');
    await policyRef.set(policyData, { merge: true });
    
    res.json({
      success: true,
      message: 'Return policy updated successfully',
      policy: policyData
    });
  } catch (error) {
    console.error('Error updating return policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating return policy'
    });
  }
});

module.exports = router;
