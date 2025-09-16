const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { db, admin } = require('../config/firebase');

// Create return request (user)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, productId, returnReason, description, condition, images } = req.body;
    const userId = req.user.uid;
    
    // Validate required fields
    if (!orderId || !productId || !returnReason) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, product ID, and return reason are required'
      });
    }
    
    // Check if order exists and belongs to user
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
         const orderData = orderDoc.data();
     
     // Get user data to populate customer information
     let userData = null;
     try {
       const userRef = db.collection('users').doc(userId);
       const userDoc = await userRef.get();
       if (userDoc.exists) {
         userData = userDoc.data();
       }
     } catch (userError) {
       console.log('Could not fetch user data:', userError.message);
     }
     
     // Debug: Log available fields in order data
     console.log('Available order fields:', Object.keys(orderData));
     console.log('Order data sample:', {
       userId: orderData.userId,
       customerName: orderData.customerName,
       customerEmail: orderData.customerEmail,
       name: orderData.name,
       email: orderData.email,
       orderNumber: orderData.orderNumber
     });
     console.log('User data:', userData);
     
     if (orderData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create return requests for your own orders'
      });
    }
    
    // Check if product exists in order (try multiple field names)
    let productItem = null;
    
    // Try different possible field names for product ID
    productItem = orderData.items.find(item => 
      item.productId === productId || 
      item._id === productId || 
      item.id === productId
    );
    
    if (!productItem) {
      // Try string comparison as fallback
      productItem = orderData.items.find(item => {
        const itemFields = [
          String(item.productId || ''),
          String(item._id || ''),
          String(item.id || '')
        ];
        const searchId = String(productId);
        return itemFields.some(field => field === searchId);
      });
    }
    
         if (!productItem) {
       console.error('Product not found in order. Available items:', orderData.items);
       console.error('Searching for product ID:', productId);
       return res.status(404).json({
         success: false,
         message: 'Product not found in order. Please check the product ID.'
       });
     }
     
     // Debug: Log available fields in product item
     console.log('Available product item fields:', Object.keys(productItem));
     console.log('Product item sample:', {
       productName: productItem.productName,
       productImage: productItem.productImage,
       productPrice: productItem.productPrice,
       name: productItem.name,
       image: productItem.image,
       price: productItem.price,
       category: productItem.category,
       quantity: productItem.quantity
     });
    
    // Check if return request already exists
    const existingRequestRef = db.collection('returnRequests')
      .where('orderId', '==', orderId)
      .where('productId', '==', productId)
      .where('userId', '==', userId);
    
    const existingRequests = await existingRequestRef.get();
    if (!existingRequests.empty) {
      return res.status(400).json({
        success: false,
        message: 'Return request already exists for this product'
      });
    }
    
    // Get return policy to check eligibility
    const policyRef = db.collection('returnPolicy').doc('default');
    const policyDoc = await policyRef.get();
    let policy = null;
    
    if (policyDoc.exists) {
      policy = policyDoc.data();
    }
    
    // Check if product is returnable
    if (policy && policy.nonReturnableCategories.includes(productItem.category?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Products in category '${productItem.category}' are not eligible for returns`
      });
    }
    
         // Check if order is delivered (required for returns)
     if (orderData.status !== 'delivered' && orderData.deliveryStatus !== 'delivered') {
       return res.status(400).json({
         success: false,
         message: 'Product cannot be returned before delivery. Please wait for successful delivery.'
       });
     }
     
     // Check return window
     if (policy) {
       let orderDate;
       
       // Handle different date formats
       if (orderData.createdAt && typeof orderData.createdAt.toDate === 'function') {
         // Firestore timestamp
         orderDate = orderData.createdAt.toDate();
       } else if (orderData.createdAt) {
         // Regular date string or Date object
         orderDate = new Date(orderData.createdAt);
       } else {
         // Fallback to current date if no order date
         orderDate = new Date();
       }
       
       const currentDate = new Date();
       const daysDiff = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
       
       if (daysDiff > policy.returnWindow) {
         return res.status(400).json({
           success: false,
           message: `Return window of ${policy.returnWindow} days has expired`
         });
       }
     }
    
         // Create return request
     const returnRequestData = {
       orderId,
       productId,
       userId,
       returnReason,
       description: description || '',
       condition: condition || 'good',
       images: images || [],
       status: 'pending',
       orderNumber: orderData.orderNumber || `ORDER-${orderId}`,
       orderDate: orderData.createdAt,
       customerName: orderData.customerName || orderData.name || userData?.firstName || userData?.name || 'Customer',
       customerEmail: orderData.customerEmail || orderData.email || userData?.email || '',
       productName: productItem.productName || productItem.name || 'Product',
       productImage: productItem.productImage || productItem.image || '',
       productPrice: productItem.productPrice || productItem.price || 0,
       quantity: productItem.quantity || 1,
       category: productItem.category || 'General',
       customer: userData || null,
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
       updatedAt: admin.firestore.FieldValue.serverTimestamp()
     };
     
     // Final validation: Remove any undefined values to prevent Firestore errors
     Object.keys(returnRequestData).forEach(key => {
       if (returnRequestData[key] === undefined) {
         console.warn(`Removing undefined field: ${key}`);
         delete returnRequestData[key];
       }
     });
     
     console.log('Final return request data:', returnRequestData);
    
    const returnRequestRef = db.collection('returnRequests').doc();
    await returnRequestRef.set(returnRequestData);
    
    res.json({
      success: true,
      message: 'Return request created successfully',
      returnRequestId: returnRequestRef.id
    });
    
  } catch (error) {
    console.error('Error creating return request:', error);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user?.uid);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating return request: ' + error.message
    });
  }
});

// Get all return requests (admin)
router.get('/admin/return-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all return requests without ordering to avoid index requirements
    const returnRequestsRef = db.collection('returnRequests');
    
    const returnRequestsSnapshot = await returnRequestsRef.get();
    const returnRequests = [];
    
    returnRequestsSnapshot.forEach(doc => {
      try {
        const data = doc.data();
        returnRequests.push({
          id: doc.id,
          ...data
        });
      } catch (docError) {
        console.error('Error processing document:', doc.id, docError);
        // Skip problematic documents
      }
    });
    
    // Sort manually by createdAt date (newest first)
    if (returnRequests.length > 0) {
      returnRequests.sort((a, b) => {
        try {
          let dateA, dateB;
          
          // Handle Firestore timestamps
          if (a.createdAt && typeof a.createdAt.toDate === 'function') {
            dateA = a.createdAt.toDate();
          } else if (a.createdAt) {
            dateA = new Date(a.createdAt);
          } else {
            dateA = new Date(0); // Default to epoch if no date
          }
          
          if (b.createdAt && typeof b.createdAt.toDate === 'function') {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt) {
            dateB = new Date(b.createdAt);
          } else {
            dateB = new Date(0); // Default to epoch if no date
          }
          
          return dateB - dateA; // Sort descending (newest first)
        } catch (sortError) {
          console.error('Error sorting return requests:', sortError);
          return 0;
        }
      });
    }
    
    res.json({
      success: true,
      returnRequests
    });
    
  } catch (error) {
    console.error('Error fetching return requests:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's an index error and provide helpful message
    if (error.message && error.message.includes('FAILED_PRECONDITION') && error.message.includes('requires an index')) {
      console.error('Firebase index required. Please create the composite index for returnRequests collection.');
      res.status(500).json({
        success: false,
        message: 'Database index required. Please contact support to resolve this issue.',
        error: 'Index required for query optimization'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error fetching return requests: ' + error.message
      });
    }
  }
});

// Get user's return requests
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    console.log('Fetching return requests for user:', userId);
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get return requests without ordering first (this avoids the index requirement)
    const returnRequestsRef = db.collection('returnRequests')
      .where('userId', '==', userId);
    
    const returnRequestsSnapshot = await returnRequestsRef.get();
    const returnRequests = [];
    
    returnRequestsSnapshot.forEach(doc => {
      try {
        const data = doc.data();
        returnRequests.push({
          id: doc.id,
          ...data
        });
      } catch (docError) {
        console.error('Error processing document:', doc.id, docError);
        // Skip problematic documents
      }
    });
    
    // Sort manually by createdAt date (newest first)
    if (returnRequests.length > 0) {
      returnRequests.sort((a, b) => {
        try {
          let dateA, dateB;
          
          // Handle Firestore timestamps
          if (a.createdAt && typeof a.createdAt.toDate === 'function') {
            dateA = a.createdAt.toDate();
          } else if (a.createdAt) {
            dateA = new Date(a.createdAt);
          } else {
            dateA = new Date(0); // Default to epoch if no date
          }
          
          if (b.createdAt && typeof b.createdAt.toDate === 'function') {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt) {
            dateB = new Date(b.createdAt);
          } else {
            dateB = new Date(0); // Default to epoch if no date
          }
          
          return dateB - dateA; // Sort descending (newest first)
        } catch (sortError) {
          console.error('Error sorting return requests:', sortError);
          return 0;
        }
      });
    }
    
    console.log(`Found ${returnRequests.length} return requests for user ${userId}`);
    
    res.json({
      success: true,
      returnRequests
    });
    
  } catch (error) {
    console.error('Error fetching user return requests:', error);
    console.error('Error stack:', error.stack);
    console.error('Request user:', req.user);
    
    // Check if it's an index error and provide helpful message
    if (error.message && error.message.includes('FAILED_PRECONDITION') && error.message.includes('requires an index')) {
      console.error('Firebase index required. Please create the composite index for returnRequests collection.');
      res.status(500).json({
        success: false,
        message: 'Database index required. Please contact support to resolve this issue.',
        error: 'Index required for query optimization'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error fetching return requests: ' + error.message
      });
    }
  }
});

// Get return request by ID (user) - This must come AFTER admin routes to avoid conflicts
router.get('/user/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    
    const returnRequestRef = db.collection('returnRequests').doc(id);
    const returnRequestDoc = await returnRequestRef.get();
    
    if (!returnRequestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }
    
    const returnRequestData = returnRequestDoc.data();
    if (returnRequestData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own return requests'
      });
    }
    
    res.json({
      success: true,
      returnRequest: {
        id: returnRequestDoc.id,
        ...returnRequestData
      }
    });
    
  } catch (error) {
    console.error('Error fetching return request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return requests'
    });
  }
});

// Update return request status (admin)
router.patch('/admin/return-requests/:id/:action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, action } = req.params;
    const { reason } = req.body;
    
    if (!['approve', 'reject', 'process', 'complete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, process, or complete'
      });
    }
    
    const returnRequestRef = db.collection('returnRequests').doc(id);
    const returnRequestDoc = await returnRequestRef.get();
    
    if (!returnRequestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }
    
    const returnRequestData = returnRequestDoc.data();
    let newStatus = action;
    
    // Map actions to statuses
    if (action === 'approve') newStatus = 'approved';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'process') newStatus = 'processing';
    else if (action === 'complete') newStatus = 'completed';
    
    const updateData = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminAction: action,
      adminReason: reason || '',
      adminId: req.user.uid
    };
    
    await returnRequestRef.update(updateData);
    
    res.json({
      success: true,
      message: `Return request ${action}ed successfully`,
      status: newStatus
    });
    
  } catch (error) {
    console.error('Error updating return request:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating return request'
    });
  }
});

// Delete return request (admin)
router.delete('/admin/return-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const returnRequestRef = db.collection('returnRequests').doc(id);
    const returnRequestDoc = await returnRequestRef.get();
    
    if (!returnRequestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }
    
    await returnRequestRef.delete();
    
    res.json({
      success: true,
      message: 'Return request deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting return request:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting return request'
    });
  }
});

// ========================================
// ORDER CANCELLATION ROUTES
// ========================================

// Create order cancellation request (user)
router.post('/cancel-order', authenticateToken, async (req, res) => {
  try {
    const { orderId, productId, cancelReason, description } = req.body;
    const userId = req.user.uid;
    
    // Validate required fields
    if (!orderId || !productId || !cancelReason) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, product ID, and cancellation reason are required'
      });
    }
    
    // Check if order exists and belongs to user
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const orderData = orderDoc.data();
    
    // Get user data to populate customer information
    let userData = null;
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        userData = userDoc.data();
      }
    } catch (userError) {
      console.log('Could not fetch user data:', userError.message);
    }
    
    // Debug: Log available fields in order data
    console.log('Available order fields:', Object.keys(orderData));
    console.log('Order status:', orderData.status, orderData.deliveryStatus);
    console.log('Order data sample:', {
      userId: orderData.userId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      name: orderData.name,
      email: orderData.email,
      orderNumber: orderData.orderNumber,
      createdAt: orderData.createdAt
    });
    console.log('User data:', userData);
    
    if (orderData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders'
      });
    }
    
    // Check if order can be cancelled (before delivery)
    if (orderData.status === 'delivered' || orderData.deliveryStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after delivery. Please use return request instead.'
      });
    }
    
    // Check if order is already cancelled
    if (orderData.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }
    
    // Check if product exists in order
    let productItem = null;
    productItem = orderData.items.find(item => 
      item.productId === productId || 
      item._id === productId || 
      item.id === productId
    );
    
    if (!productItem) {
      // Try string comparison as fallback
      productItem = orderData.items.find(item => {
        const itemFields = [
          String(item.productId || ''),
          String(item._id || ''),
          String(item.id || '')
        ];
        const searchId = String(productId);
        return itemFields.some(field => field === searchId);
      });
    }
    
    if (!productItem) {
      console.error('Product not found in order. Available items:', orderData.items);
      console.error('Searching for product ID:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found in order. Please check the product ID.'
      });
    }
    
    // Check if cancellation request already exists
    const existingCancelRef = db.collection('orderCancellations')
      .where('orderId', '==', orderId)
      .where('productId', '==', productId)
      .where('userId', '==', userId);
    
    const existingCancellations = await existingCancelRef.get();
    if (!existingCancellations.empty) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation request already exists for this product'
      });
    }
    
    // Create cancellation request
    const cancellationData = {
      orderId,
      productId,
      userId,
      cancelReason,
      description: description || '',
      status: 'pending',
      orderNumber: orderData.orderNumber || `ORDER-${orderId}`,
      orderDate: orderData.createdAt,
      customerName: orderData.customerName || orderData.name || userData?.firstName || userData?.name || 'Customer',
      customerEmail: orderData.customerEmail || orderData.email || userData?.email || '',
      productName: productItem.productName || productItem.name || 'Product',
      productImage: productItem.productImage || productItem.image || '',
      productPrice: productItem.productPrice || productItem.price || 0,
      quantity: productItem.quantity || 1,
      category: productItem.category || 'General',
      orderStatus: orderData.status,
      deliveryStatus: orderData.deliveryStatus,
      customer: userData || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Final validation: Remove any undefined values
    Object.keys(cancellationData).forEach(key => {
      if (cancellationData[key] === undefined) {
        console.warn(`Removing undefined field: ${key}`);
        delete cancellationData[key];
      }
    });
    
    console.log('Final cancellation data:', cancellationData);
    
    const cancellationRef = db.collection('orderCancellations').doc();
    await cancellationRef.set(cancellationData);
    
    res.json({
      success: true,
      message: 'Order cancellation request created successfully',
      cancellationId: cancellationRef.id
    });
    
  } catch (error) {
    console.error('Error creating cancellation request:', error);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user?.uid);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating cancellation request: ' + error.message
    });
  }
});

// Get user's order cancellation requests
router.get('/user-cancellations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    console.log('Fetching cancellation requests for user:', userId);
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get cancellation requests without ordering to avoid index requirements
    const cancellationsRef = db.collection('orderCancellations')
      .where('userId', '==', userId);
    
    const cancellationsSnapshot = await cancellationsRef.get();
    const cancellations = [];
    
    cancellationsSnapshot.forEach(doc => {
      try {
        const data = doc.data();
        cancellations.push({
          id: doc.id,
          ...data
        });
      } catch (docError) {
        console.error('Error processing document:', doc.id, docError);
      }
    });
    
    // Sort manually by createdAt date (newest first)
    if (cancellations.length > 0) {
      cancellations.sort((a, b) => {
        try {
          let dateA, dateB;
          
          if (a.createdAt && typeof a.createdAt.toDate === 'function') {
            dateA = a.createdAt.toDate();
          } else if (a.createdAt) {
            dateA = new Date(a.createdAt);
          } else {
            dateA = new Date(0);
          }
          
          if (b.createdAt && typeof b.createdAt.toDate === 'function') {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt) {
            dateB = new Date(b.createdAt);
          } else {
            dateB = new Date(0);
          }
          
          return dateB - dateA;
        } catch (sortError) {
          console.error('Error sorting cancellations:', sortError);
          return 0;
        }
      });
    }
    
    console.log(`Found ${cancellations.length} cancellation requests for user ${userId}`);
    
    res.json({
      success: true,
      cancellations
    });
    
  } catch (error) {
    console.error('Error fetching user cancellations:', error);
    console.error('Error stack:', error.stack);
    console.error('Request user:', req.user);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching cancellation requests: ' + error.message
    });
  }
});

// Get all order cancellation requests (admin)
router.get('/admin/cancellations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all cancellation requests without ordering to avoid index requirements
    const cancellationsRef = db.collection('orderCancellations');
    
    const cancellationsSnapshot = await cancellationsRef.get();
    const cancellations = [];
    
    cancellationsSnapshot.forEach(doc => {
      try {
        const data = doc.data();
        cancellations.push({
          id: doc.id,
          ...data
        });
      } catch (docError) {
        console.error('Error processing document:', doc.id, docError);
      }
    });
    
    // Sort manually by createdAt date (newest first)
    if (cancellations.length > 0) {
      cancellations.sort((a, b) => {
        try {
          let dateA, dateB;
          
          if (a.createdAt && typeof a.createdAt.toDate === 'function') {
            dateA = a.createdAt.toDate();
          } else if (a.createdAt) {
            dateA = new Date(a.createdAt);
          } else {
            dateA = new Date(0);
          }
          
          if (b.createdAt && typeof b.createdAt.toDate === 'function') {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt) {
            dateB = new Date(b.createdAt);
          } else {
            dateB = new Date(0);
          }
          
          return dateB - dateA;
        } catch (sortError) {
          console.error('Error sorting cancellations:', sortError);
          return 0;
        }
      });
    }
    
    res.json({
      success: true,
      cancellations
    });
    
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching cancellation requests: ' + error.message
    });
  }
});

// Update cancellation request status (admin)
router.patch('/admin/cancellations/:id/:action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, action } = req.params;
    const { reason } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }
    
    const cancellationRef = db.collection('orderCancellations').doc(id);
    const cancellationDoc = await cancellationRef.get();
    
    if (!cancellationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation request not found'
      });
    }
    
    const cancellationData = cancellationDoc.data();
    let newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const updateData = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminAction: action,
      adminReason: reason || '',
      adminId: req.user.uid
    };
    
    // If approved, also update the order status
    if (action === 'approve') {
      const orderRef = db.collection('orders').doc(cancellationData.orderId);
      await orderRef.update({
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: cancellationData.cancelReason,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await cancellationRef.update(updateData);
    
    res.json({
      success: true,
      message: `Cancellation request ${action}ed successfully`,
      status: newStatus
    });
    
  } catch (error) {
    console.error('Error updating cancellation request:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cancellation request'
    });
  }
});

module.exports = router;

