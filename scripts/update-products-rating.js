const { db } = require('../config/firebase');

async function updateProductsRating() {
  try {
    console.log('Starting to update products with default rating fields...');
    
    // Get all products
    const productsSnapshot = await db.collection('products').get();
    
    if (productsSnapshot.empty) {
      console.log('No products found in database');
      return;
    }
    
    console.log(`Found ${productsSnapshot.size} products to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each product
    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();
      
      // Check if rating fields already exist
      if (productData.rating !== undefined && productData.reviewCount !== undefined) {
        console.log(`Product ${doc.id} already has rating fields, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Update product with default rating fields
      await db.collection('products').doc(doc.id).update({
        rating: 0,
        reviewCount: 0,
        updatedAt: new Date()
      });
      
      console.log(`Updated product ${doc.id} with default rating fields`);
      updatedCount++;
    }
    
    console.log(`\nUpdate completed!`);
    console.log(`Updated: ${updatedCount} products`);
    console.log(`Skipped: ${skippedCount} products (already had rating fields)`);
    
  } catch (error) {
    console.error('Error updating products:', error);
  }
}

// Run the update
updateProductsRating()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
