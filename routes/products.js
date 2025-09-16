// const express = require('express');
// const { db } = require('../config/firebase');
// const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// const router = express.Router();

// // Get all products (with optional filtering)
// router.get('/', optionalAuth, async (req, res) => {
//   try {
//     const { category, search, sort, limit = 20, page = 1 } = req.query;
    
//     // Simplified query to avoid index requirements
//     let query = db.collection('products').where('isActive', '==', true);
    
//     // Apply pagination
//     query = query.limit(parseInt(limit));
    
//     const snapshot = await query.get();
    
//     const products = [];
//     snapshot.forEach(doc => {
//       const productData = doc.data();
//       products.push({
//         id: doc.id,
//         ...productData
//       });
//     });
    
//     // Apply client-side filtering and sorting
//     let filteredProducts = products;
    
//     // Filter by category
//     if (category && category !== 'all') {
//       filteredProducts = filteredProducts.filter(product => product.category === category);
//     }
    
//     // Search functionality
//     if (search) {
//       filteredProducts = filteredProducts.filter(product => 
//         product.name.toLowerCase().includes(search.toLowerCase())
//       );
//     }
    
//     // Apply sorting
//     if (sort) {
//       switch (sort) {
//         case 'price-low':
//           filteredProducts.sort((a, b) => a.price - b.price);
//           break;
//         case 'price-high':
//           filteredProducts.sort((a, b) => b.price - a.price);
//           break;
//         case 'name':
//           filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
//           break;
//         case 'newest':
//           filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//           break;
//         default:
//           filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//       }
//     } else {
//       filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     }
    
//     // Apply pagination
//     const total = filteredProducts.length;
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + parseInt(limit);
//     const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
//     res.json({
//       products: paginatedProducts,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });
    
//   } catch (error) {
//     console.error('Get products error:', error);
//     res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//   }
// });

// // Get product by ID
// router.get('/:id', optionalAuth, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const productDoc = await db.collection('products').doc(id).get();
    
//     if (!productDoc.exists) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
    
//     const product = {
//       id: productDoc.id,
//       ...productDoc.data()
//     };
    
//     // Check if user is authenticated and add wishlist status
//     if (req.user) {
//       const wishlistDoc = await db.collection('wishlists')
//         .where('userId', '==', req.user.uid)
//         .where('productId', '==', id)
//         .limit(1)
//         .get();
      
//       product.isWishlisted = !wishlistDoc.empty;
//     }
    
//     res.json({ product });
    
//   } catch (error) {
//     console.error('Get product error:', error);
//     res.status(500).json({ error: 'Failed to fetch product', details: error.message });
//   }
// });

// // Get products by category
// router.get('/category/:category', optionalAuth, async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { limit = 20, page = 1 } = req.query;
    
//     // Simplified query to avoid index requirements
//     let query = db.collection('products')
//       .where('isActive', '==', true)
//       .limit(parseInt(limit));
    
//     const snapshot = await query.get();
    
//     const products = [];
//     snapshot.forEach(doc => {
//       const productData = doc.data();
//       products.push({
//         id: doc.id,
//         ...productData
//       });
//     });
    
//     // Filter by category on client side
//     const filteredProducts = products.filter(product => product.category === category);
    
//     // Sort by creation date
//     filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
//     // Apply pagination
//     const total = filteredProducts.length;
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + parseInt(limit);
//     const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
//     res.json({
//       products: paginatedProducts,
//       category,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });
    
//   } catch (error) {
//     console.error('Get products by category error:', error);
//     res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//   }
// });

// // Get all categories
// router.get('/categories/all', async (req, res) => {
//   try {
//     const categoriesSnapshot = await db.collection('categories').get();
    
//     const categories = [];
//     categoriesSnapshot.forEach(doc => {
//       categories.push({
//         id: doc.id,
//         ...doc.data()
//       });
//     });
    
//     res.json({ categories });
    
//   } catch (error) {
//     console.error('Get categories error:', error);
//     res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
//   }
// });

// // Admin: Add new product
// router.post('/', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       price,
//       category,
//       stock,
//       gst,
//       images,
//       specifications,
//       benefits,
//       usage
//     } = req.body;
    
//     // Validate required fields
//     if (!name || !description || !price || !category || stock === undefined) {
//       return res.status(400).json({ error: 'All required fields must be provided' });
//     }
    
//     const productData = {
//       name,
//       description,
//       price: parseFloat(price),
//       category,
//       stock: parseInt(stock),
//       gst: parseFloat(gst) || 0,
//       images: images || [],
//       specifications: specifications || {},
//       benefits: benefits || [],
//       usage: usage || '',
//       isActive: true,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
    
//     const docRef = await db.collection('products').add(productData);
    
//     res.status(201).json({
//       message: 'Product added successfully',
//       productId: docRef.id,
//       product: {
//         id: docRef.id,
//         ...productData
//       }
//     });
    
//   } catch (error) {
//     console.error('Add product error:', error);
//     res.status(500).json({ error: 'Failed to add product', details: error.message });
//   }
// });

// // Admin: Update product
// router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
    
//     // Remove fields that shouldn't be updated
//     delete updateData.id;
//     delete updateData.createdAt;
    
//     updateData.updatedAt = new Date().toISOString();
    
//     // Convert numeric fields
//     if (updateData.price) updateData.price = parseFloat(updateData.price);
//     if (updateData.stock) updateData.stock = parseInt(updateData.stock);
//     if (updateData.gst) updateData.gst = parseFloat(updateData.gst);
    
//     await db.collection('products').doc(id).update(updateData);
    
//     res.json({
//       message: 'Product updated successfully',
//       productId: id
//     });
    
//   } catch (error) {
//     console.error('Update product error:', error);
//     res.status(500).json({ error: 'Failed to update product', details: error.message });
//   }
// });

// // Admin: Delete product
// router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Soft delete - mark as inactive instead of actually deleting
//     await db.collection('products').doc(id).update({
//       isActive: false,
//       updatedAt: new Date().toISOString()
//     });
    
//     res.json({
//       message: 'Product deleted successfully',
//       productId: id
//     });
    
//   } catch (error) {
//     console.error('Delete product error:', error);
//     res.status(500).json({ error: 'Failed to delete product', details: error.message });
//   }
// });

// // Admin: Get all products (including inactive)
// router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { limit = 50, page = 1 } = req.query;
    
//     let query = db.collection('products').orderBy('createdAt', 'desc');
    
//     // Apply pagination
//     const offset = (page - 1) * limit;
//     query = query.limit(parseInt(limit)).offset(offset);
    
//     const snapshot = await query.get();
    
//     const products = [];
//     snapshot.forEach(doc => {
//       products.push({
//         id: doc.id,
//         ...doc.data()
//       });
//     });
    
//     // Get total count
//     const totalSnapshot = await db.collection('products').get();
//     const total = totalSnapshot.size;
    
//     res.json({
//       products,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });
    
//   } catch (error) {
//     console.error('Admin get products error:', error);
//     res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//   }
// });

// module.exports = router;



// const express = require('express');
// const { db } = require('../config/firebase');
// const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// const router = express.Router();

// // New: Admin route to fetch all products for the admin panel
// // This route directly corresponds to the GET request from the Products.js component.
// router.get('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { limit = 50, page = 1 } = req.query;

//     // Fetch all products, sorted by creation date
//     let query = db.collection('products').orderBy('createdAt', 'desc');

//     // Apply pagination
//     const offset = (page - 1) * limit;
//     query = query.limit(parseInt(limit)).offset(offset);

//     const snapshot = await query.get();

//     const products = [];
//     snapshot.forEach(doc => {
//       products.push({
//         id: doc.id,
//         ...doc.data()
//       });
//     });

//     // Get the total count of products for pagination metadata
//     const totalSnapshot = await db.collection('products').get();
//     const total = totalSnapshot.size;

//     res.json({
//       products,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });

//   } catch (error) {
//     console.error('Admin get products error:', error);
//     res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//   }
// });

// // The remaining routes are reordered from most specific to least specific
// // Get all categories
// router.get('/categories/all', async (req, res) => {
//   try {
//     const snapshot = await db.collection('products').get();
//     const categoriesSet = new Set();
//     snapshot.forEach(doc => {
//       const data = doc.data();
//       if (data.category) categoriesSet.add(data.category);
//     });
//     res.json(Array.from(categoriesSet));
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch categories' });
//   }
// });

// // Get products by category
// router.get('/category/:category', optionalAuth, async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { limit = 20, page = 1 } = req.query;
//     let query = db.collection('products').where('isActive', '==', true).limit(parseInt(limit));
//     const snapshot = await query.get();
//     const products = [];
//     snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
//     const filteredProducts = products.filter(p => p.category === category);
//     filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     const total = filteredProducts.length;
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + parseInt(limit);
//     const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
//     res.json({
//       products: paginatedProducts,
//       category,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error('Get products by category error:', error);
//     res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//   }
// });

// // Get product by ID
// router.get('/:id', optionalAuth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const productDoc = await db.collection('products').doc(id).get();
//     if (!productDoc.exists) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
//     const product = { id: productDoc.id, ...productDoc.data() };
//     if (req.user) {
//       const wishlistDoc = await db.collection('wishlists').where('userId', '==', req.user.uid).where('productId', '==', id).limit(1).get();
//       product.isWishlisted = !wishlistDoc.empty;
//     }
//     res.json({ product });
//   } catch (error) {
//     console.error('Get product error:', error);
//     res.status(500).json({ error: 'Failed to fetch product', details: error.message });
//   }
// });

// // Get all products (general client view)
// router.get('/', optionalAuth, async (req, res) => {
//   try {
//     // ... (Your existing logic for fetching products for the public view)
//     const { category, search, sort, limit = 20, page = 1 } = req.query;
    
//     // Simplified query to avoid index requirements
//     let query = db.collection('products').where('isActive', '==', true);
    
//     // Apply pagination
//     query = query.limit(parseInt(limit));
    
//     const snapshot = await query.get();
    
//     const products = [];
//     snapshot.forEach(doc => {
//       const productData = doc.data();
//       products.push({
//         id: doc.id,
//         ...productData
//       });
//     });
    
//     // Apply client-side filtering and sorting
//     let filteredProducts = products;
    
//     // Filter by category
//     if (category && category !== 'all') {
//       filteredProducts = filteredProducts.filter(product => product.category === category);
//     }
    
//     // Search functionality
//     if (search) {
//       filteredProducts = filteredProducts.filter(product => 
//         product.name.toLowerCase().includes(search.toLowerCase())
//       );
//     }
    
//     // Apply sorting
//     if (sort) {
//       switch (sort) {
//         case 'price-low':
//           filteredProducts.sort((a, b) => a.price - b.price);
//           break;
//         case 'price-high':
//           filteredProducts.sort((a, b) => b.price - a.price);
//           break;
//         case 'name':
//           filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
//           break;
//         case 'newest':
//           filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//           break;
//         default:
//           filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//       }
//     } else {
//       filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     }
    
//     // Apply pagination
//     const total = filteredProducts.length;
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + parseInt(limit);
//     const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
//     res.json({
//       products: paginatedProducts,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error('Get products error:', error);
//     res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//   }
// });

// // Admin: Add new product
// router.post('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { name, description, price, category, stock, gst, images, features } = req.body;
    
//     // Validate required fields
//     if (!name || !description || !price || !category || stock === undefined) {
//       return res.status(400).json({ error: 'All required fields must be provided' });
//     }
    
//     const productData = {
//       name,
//       description,
//       price: parseFloat(price),
//       category,
//       stock: parseInt(stock),
//       gst: parseFloat(gst) || 0,
//       images: images || [],
//       features: features || [],
//       isActive: true,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
    
//     const docRef = await db.collection('products').add(productData);
    
//     res.status(201).json({
//       message: 'Product added successfully',
//       productId: docRef.id,
//       product: {
//         id: docRef.id,
//         ...productData
//       }
//     });
    
//   } catch (error) {
//     console.error('Add product error:', error);
//     res.status(500).json({ error: 'Failed to add product', details: error.message });
//   }
// });


// // Admin: Update product
// router.put('/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
    
//     // Remove fields that shouldn't be updated
//     delete updateData.id;
//     delete updateData.createdAt;
    
//     updateData.updatedAt = new Date().toISOString();
    
//     // Convert numeric fields
//     if (updateData.price) updateData.price = parseFloat(updateData.price);
//     if (updateData.stock) updateData.stock = parseInt(updateData.stock);
//     if (updateData.gst) updateData.gst = parseFloat(updateData.gst);
    
//     await db.collection('products').doc(id).update(updateData);
    
//     res.json({
//       message: 'Product updated successfully',
//       productId: id
//     });
    
//   } catch (error) {
//     console.error('Update product error:', error);
//     res.status(500).json({ error: 'Failed to update product', details: error.message });
//   }
// });

// // Admin: Delete product
// router.delete('/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Soft delete - mark as inactive instead of actually deleting
//     await db.collection('products').doc(id).update({
//       isActive: false,
//       updatedAt: new Date().toISOString()
//     });
    
//     res.json({
//       message: 'Product deleted successfully',
//       productId: id
//     });
    
//   } catch (error) {
//     console.error('Delete product error:', error);
//     res.status(500).json({ error: 'Failed to delete product', details: error.message });
//   }
// });
// // Admin: Get all products
// router.get('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const snapshot = await db.collection('products').get();
//     const products = [];
//     snapshot.forEach(doc => {
//       products.push({ id: doc.id, ...doc.data() });
//     });
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch products' });
//   }
// });

// // Admin: Add product
// router.post('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { name, description, price, category, stock } = req.body;
//     if (!name || !description || !price || !category || stock === undefined) {
//       return res.status(400).json({ error: 'All required fields must be provided' });
//     }
//     const newProduct = {
//       name,
//       description,
//       price,
//       category,
//       stock,
//       createdAt: new Date(),
//       isActive: true
//     };
//     const docRef = await db.collection('products').add(newProduct);
//     res.status(201).json({ id: docRef.id, ...newProduct });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to add product' });
//   }
// });
// // // Latest products (sorted by createdAt desc)
// // router.get('/latest', async (req, res) => {
// //   try {
// //     const snapshot = await db.collection('products').orderBy('createdAt', 'desc').limit(8).get();
// //     const products = [];
// //     snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
// //     res.json(products);
// //   } catch (error) {
// //     res.status(500).json({ error: 'Failed to fetch latest products' });
// //   }
// // });

// // // Best selling products (sorted by salesCount desc)
// // router.get('/best-selling', async (req, res) => {
// //   try {
// //     const snapshot = await db.collection('products').orderBy('salesCount', 'desc').limit(8).get();
// //     const products = [];
// //     snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
// //     res.json(products);
// //   } catch (error) {
// //     res.status(500).json({ error: 'Failed to fetch best selling products' });
// //   }
// // });

// module.exports = router;


const express = require('express');
const { db, storage } = require('../config/firebase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

async function uploadFiles(files, folder = 'products') {
  const urls = [];
  const bucket = storage.bucket();

  for (const file of files) {
    const fileName = `${folder}/${Date.now()}_${file.originalname}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: file.mimetype }
    });

    blobStream.end(file.buffer);

    await new Promise((resolve, reject) => {
      blobStream.on('finish', resolve);
      blobStream.on('error', reject);
    });

    const [url] = await blob.getSignedUrl({ action: 'read', expires: '12-31-2100' });
    urls.push(url);
  }

  return urls;
}

// Normalize function for case-insensitive comparisons
const norm = v => (v || '').toString().trim().toLowerCase();

// Get all products (user side, with optional filtering/search/sort)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, sort, limit = 20, page = 1 } = req.query;

    const snapshot = await db.collection('products').get();
    let products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Clean up malformed image URLs
      if (data.images && Array.isArray(data.images)) {
        data.images = data.images.filter(img => 
          img && typeof img === 'string' && img.length > 10 && 
          (img.startsWith('http') || img.startsWith('/') && img.length > 5)
        );
      }
      
      console.log('Fetched product:', { id: doc.id, ...data }); // Debug log
      products.push({ id: doc.id, ...data });
    });

    let filtered = products;

    if (category && category !== 'all') {
      const wanted = norm(category);
      filtered = filtered.filter(p => norm(p.category) === wanted);
    }

    if (search) {
      const q = norm(search);
      filtered = filtered.filter(p =>
        norm(p.name).includes(q) ||
        norm(p.description).includes(q)
      );
    }

    switch (sort) {
      case 'price-low':
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    const L = parseInt(limit, 10) || 20;
    const P = parseInt(page, 10) || 1;
    const start = (P - 1) * L;
    const paginated = filtered.slice(start, start + L);

    console.log('Returning products:', paginated); // Debug log
    res.json({
      products: paginated,
      pagination: {
        currentPage: P,
        totalPages: Math.max(1, Math.ceil(filtered.length / L)),
        totalItems: filtered.length,
        itemsPerPage: L
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get all categories — must be BEFORE dynamic ":id" route
router.get('/categories/all', async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('categories').get();
    let categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });

    // Fallback: derive categories from products if categories collection is empty
    if (categories.length === 0) {
      const productsSnapshot = await db.collection('products').get();
      const set = new Set();
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.category) {
          set.add(data.category);
        }
      });
      categories = Array.from(set).map(c => ({ id: c, name: c }));
    }

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// Get products by category (user side) — must be BEFORE ":id" route
router.get('/category/:category', optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const snapshot = await db.collection('products').get();
    let products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Clean up malformed image URLs
      if (data.images && Array.isArray(data.images)) {
        data.images = data.images.filter(img => 
          img && typeof img === 'string' && img.length > 10 && 
          (img.startsWith('http') || img.startsWith('/') && img.length > 5)
        );
      }
      
      console.log('Fetched product for category:', { id: doc.id, ...data }); // Debug log
      products.push({ id: doc.id, ...data });
    });

    const wantedCategory = norm(category);
    products = products.filter(p => norm(p.category) === wantedCategory);

    products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const L = parseInt(limit, 10) || 20;
    const P = parseInt(page, 10) || 1;
    const start = (P - 1) * L;
    const paginated = products.slice(start, start + L);

    console.log('Returning category products:', paginated); // Debug log
    res.json({
      products: paginated,
      category,
      pagination: {
        currentPage: P,
        totalPages: Math.max(1, Math.ceil(products.length / L)),
        totalItems: products.length,
        itemsPerPage: L
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: 'Failed to fetch products by category', details: error.message });
  }
});

// Get product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const productDoc = await db.collection('products').doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = productDoc.data();
    
    // Clean up malformed image URLs
    if (productData.images && Array.isArray(productData.images)) {
      productData.images = productData.images.filter(img => 
        img && typeof img === 'string' && img.length > 10 && 
        (img.startsWith('http') || img.startsWith('/') && img.length > 5)
      );
    }
    
    const product = { id: productDoc.id, ...productData };
    console.log('Returning product by ID:', product); // Debug log
    
    if (req.user) {
      const wishlistDoc = await db.collection('wishlists')
        .where('userId', '==', req.user.uid)
        .where('productId', '==', id)
        .limit(1)
        .get();
      product.isWishlisted = !wishlistDoc.empty;
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// Update the POST route to handle multiple images and video
router.post('/admin/products', authenticateToken, requireAdmin, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, price, category, stock, sgst, cgst, features, quantityUnit, deliveryCharge, freeDeliveryThreshold } = req.body;
    const files = req.files;

    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    let imageUrls = [];
    if (files.images && files.images.length > 0) {
      imageUrls = await uploadFiles(files.images, 'products/images');
    }

    let videoUrl = '';
    if (files.video && files.video.length > 0) {
      const videoUrls = await uploadFiles(files.video, 'products/videos');
      videoUrl = videoUrls[0];
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      sgst: parseFloat(sgst) || 0,
      cgst: parseFloat(cgst) || 0,
      quantityUnit: quantityUnit || 'piece',
      deliveryCharge: parseFloat(deliveryCharge) || 0,
      freeDeliveryThreshold: parseFloat(freeDeliveryThreshold) || 0,
      images: imageUrls,
      video: videoUrl,  // Add video URL
      features: features ? JSON.parse(features) : [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('products').add(productData);

    res.status(201).json({
      message: 'Product added successfully',
      productId: docRef.id,
      product: {
        id: docRef.id,
        ...productData
      }
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
});


// // Update product image
// router.put('/admin/products/:id/image/:index', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
//   try {
//     const { id, index } = req.params;
//     const file = req.file;
    
//     if (!file) {
//       return res.status(400).json({ error: 'No image file provided' });
//     }
    
//     // Upload new image
//     const imageUrl = await uploadImages([file]);
    
//     // Get current product
//     const productDoc = await db.collection('products').doc(id).get();
//     if (!productDoc.exists) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
    
//     const productData = productDoc.data();
//     const images = productData.images || [];
    
//     // Replace image at specified index
//     if (index >= 0 && index < images.length) {
//       images[index] = imageUrl[0];
//     } else {
//       // Add new image if index is beyond current array
//       images.push(imageUrl[0]);
//     }
    
//     // Update product
//     await db.collection('products').doc(id).update({
//       images,
//       updatedAt: new Date().toISOString()
//     });
    
//     res.json({
//       message: 'Product image updated successfully',
//       imageUrl: imageUrl[0]
//     });
//   } catch (error) {
//     console.error('Update product image error:', error);
//     res.status(500).json({ error: 'Failed to update product image', details: error.message });
//   }
// });

// // Remove product image
// router.delete('/admin/products/:id/image/:index', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { id, index } = req.params;
    
//     // Get current product
//     const productDoc = await db.collection('products').doc(id).get();
//     if (!productDoc.exists) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
    
//     const productData = productDoc.data();
//     const images = productData.images || [];
    
//     // Check if we have at least one image remaining
//     if (images.length <= 1) {
//       return res.status(400).json({ error: 'Product must have at least one image' });
//     }
    
//     // Remove image at specified index
//     if (index >= 0 && index < images.length) {
//       images.splice(index, 1);
//     }
    
//     // Update product
//     await db.collection('products').doc(id).update({
//       images,
//       updatedAt: new Date().toISOString()
//     });
    
//     res.json({
//       message: 'Product image removed successfully'
//     });
//   } catch (error) {
//     console.error('Remove product image error:', error);
//     res.status(500).json({ error: 'Failed to remove product image', details: error.message });
//   }
// });


// // UPDATED: Fix typo in upload function (uploadImages -> uploadFiles)
// router.put('/admin/products/:id/image/:index', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
//   try {
//     const { id, index } = req.params;
//     const file = req.file;
    
//     if (!file) {
//       return res.status(400).json({ error: 'No image file provided' });
//     }
    
//     // Upload new image (FIXED: Changed to uploadFiles)
//     const imageUrls = await uploadFiles([file], 'products/images');
    
//     // Get current product
//     const productDoc = await db.collection('products').doc(id).get();
//     if (!productDoc.exists) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
    
//     const productData = productDoc.data();
//     const images = productData.images || [];
    
//     // Replace image at specified index
//     if (parseInt(index) >= 0 && parseInt(index) < images.length) {
//       images[parseInt(index)] = imageUrls[0];
//     } else {
//       // Add new image if index is beyond current array
//       images.push(imageUrls[0]);
//     }
    
//     // Update product
//     await db.collection('products').doc(id).update({
//       images,
//       updatedAt: new Date().toISOString()
//     });
    
//     res.json({
//       success: true,
//       message: 'Product image updated successfully',
//       imageUrl: imageUrls[0]
//     });
//   } catch (error) {
//     console.error('Update product image error:', error);
//     res.status(500).json({ error: 'Failed to update product image', details: error.message });
//   }
// });


// Update product image
router.put('/admin/products/:id/image/:index', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id, index } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    const [url] = await uploadFiles([file], 'products/images');

    const productRef = db.collection('products').doc(id);
    const productDoc = await productRef.get();
    if (!productDoc.exists) return res.status(404).json({ error: 'Product not found' });

    const data = productDoc.data();
    data.images[parseInt(index)] = url;
    await productRef.update({ images: data.images, updatedAt: new Date().toISOString() });

    res.json({ success: true, images: data.images });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update image', details: err.message });
  }
});


// Existing DELETE image route (no changes, but now with frontend refresh, 400s should be prevented)
router.delete('/admin/products/:id/image/:index', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, index } = req.params;
    
    // Get current product
    const productDoc = await db.collection('products').doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = productDoc.data();
    const images = productData.images || [];
    
    // Check if we have at least one image remaining
    if (images.length <= 1) {
      return res.status(400).json({ error: 'Product must have at least one image' });
    }
    
    // Remove image at specified index
    if (parseInt(index) >= 0 && parseInt(index) < images.length) {
      images.splice(parseInt(index), 1);
    }
    
    // Update product
    await db.collection('products').doc(id).update({
      images,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Product image removed successfully'
    });
  } catch (error) {
    console.error('Remove product image error:', error);
    res.status(500).json({ error: 'Failed to remove product image', details: error.message });
  }
});

// // NEW: Update product video
// router.put('/admin/products/:id/video', authenticateToken, requireAdmin, upload.single('video'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const file = req.file;
    
//     if (!file) {
//       return res.status(400).json({ error: 'No video file provided' });
//     }
    
//     // Upload new video
//     const videoUrls = await uploadFiles([file], 'products/videos');
//     const videoUrl = videoUrls[0];
    
//     // Get current product
//     const productDoc = await db.collection('products').doc(id).get();
//     if (!productDoc.exists) {
//       return res.status(404).json({ error: 'Product not found' });
//     }
    
//     // Update product video
//     await db.collection('products').doc(id).update({
//       video: videoUrl,
//       updatedAt: new Date().toISOString()
//     });
    
//     res.json({
//       success: true,
//       message: 'Product video updated successfully',
//       videoUrl
//     });
//   } catch (error) {
//     console.error('Update product video error:', error);
//     res.status(500).json({ error: 'Failed to update product video', details: error.message });
//   }
// });

// Update product video
router.put('/admin/products/:id/video', authenticateToken, requireAdmin, upload.single('video'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No video uploaded' });

    const [url] = await uploadFiles([file], 'products/videos');

    await db.collection('products').doc(id).update({
      video: url,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, video: url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update video', details: err.message });
  }
});

// NEW: Remove product video
router.delete('/admin/products/:id/video', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current product
    const productDoc = await db.collection('products').doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Remove video (set to empty string)
    await db.collection('products').doc(id).update({
      video: '',
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Product video removed successfully'
    });
  } catch (error) {
    console.error('Remove product video error:', error);
    res.status(500).json({ error: 'Failed to remove product video', details: error.message });
  }
});



// Similarly update the PUT route
router.put('/admin/products/:id', authenticateToken, requireAdmin, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const files = req.files;

    delete updateData.id;
    delete updateData.createdAt;

    updateData.updatedAt = new Date().toISOString();

    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.sgst) updateData.sgst = parseFloat(updateData.sgst);
    if (updateData.cgst) updateData.cgst = parseFloat(updateData.cgst);
    if (updateData.quantityUnit) updateData.quantityUnit = updateData.quantityUnit;
    if (updateData.deliveryCharge) updateData.deliveryCharge = parseFloat(updateData.deliveryCharge);
    if (updateData.freeDeliveryThreshold) updateData.freeDeliveryThreshold = parseFloat(updateData.freeDeliveryThreshold);
    if (updateData.features) updateData.features = JSON.parse(updateData.features);

    if (files.images && files.images.length > 0) {
      const imageUrls = await uploadFiles(files.images, 'products/images');
      updateData.images = imageUrls;
    }

    if (files.video && files.video.length > 0) {
      const videoUrls = await uploadFiles(files.video, 'products/videos');
      updateData.video = videoUrls[0];
    }

    const productDoc = await db.collection('products').doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.collection('products').doc(id).update(updateData);

    res.json({
      message: 'Product updated successfully',
      productId: id
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Admin: Delete product (hard delete) 

router.delete('/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hard delete - permanently removes the product from the database
    await db.collection('products').doc(id).delete();
    
    res.json({
      message: 'Product permanently deleted successfully',
      productId: id
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});
// // Admin: Get all products
// router.get('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const snapshot = await db.collection('products').get();
//     const products = [];
//     snapshot.forEach(doc => {
//       products.push({ id: doc.id, ...doc.data() });
//     });
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch products' });
//   }
// });
// Admin: Get all products
router.get('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Clean up malformed image URLs
      if (data.images && Array.isArray(data.images)) {
        data.images = data.images.filter(img => 
          img && typeof img === 'string' && img.length > 10 && 
          (img.startsWith('http') || img.startsWith('/') && img.length > 5)
        );
      }
      
      return {
        id: doc.id,
        ...data,
      };
    });
    res.json({ products });   // ✅ always return { products: [...] }
  } catch (error) {
    console.error("Error fetching admin products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


module.exports = router;
