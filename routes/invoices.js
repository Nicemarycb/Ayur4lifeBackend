// const express = require('express');
// const { db } = require('../config/firebase');
// const { authenticateToken } = require('../middleware/auth');
// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');

// const router = express.Router();

// // Test endpoint to verify route is working
// router.get('/test', (req, res) => {
//   res.json({ 
//     message: 'Invoice routes are working', 
//     timestamp: new Date().toISOString(),
//     pdfkit: typeof PDFDocument !== 'undefined' ? 'Available' : 'Not available'
//   });
// });

// // Simple test endpoint without auth
// router.get('/ping', (req, res) => {
//   res.json({ message: 'pong', timestamp: new Date().toISOString() });
// });

// // Test PDF generation without authentication
// router.get('/test-pdf', (req, res) => {
//   try {
//     console.log('Testing PDF generation...');
//     const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    
//     doc.pipe(res);
//     doc.text('Test PDF - Invoice system is working!', 50, 50);
//     doc.end();
    
//     console.log('Test PDF generated successfully');
//   } catch (error) {
//     console.error('Test PDF error:', error);
//     res.status(500).json({ error: 'Test PDF failed', details: error.message });
//   }
// });

// // // Generate and download invoice for an order
// // router.get('/:orderId/download', authenticateToken, async (req, res) => {
// //   let doc = null;
  
// //   try {
// //     console.log('=== Invoice Download Request ===');
// //     console.log('Order ID:', req.params.orderId);
// //     console.log('User:', req.user);
    
// //     const { orderId } = req.params;
    
// //     // Get order details
// //     console.log('Fetching order from database...');
// //     const orderDoc = await db.collection('orders').doc(orderId).get();
    
// //     if (!orderDoc.exists) {
// //       console.log('Order not found');
// //       return res.status(404).json({ error: 'Order not found' });
// //     }
    
// //     const order = orderDoc.data();
// //     console.log('Order data:', JSON.stringify(order, null, 2));
    
// //     // Check if user owns this order or is admin
// //     if (order.userId !== req.user.uid && req.user.role !== 'admin') {
// //       console.log('Unauthorized access - User ID:', req.user.uid, 'Order User ID:', order.userId);
// //       return res.status(403).json({ error: 'Unauthorized access' });
// //     }
    
// //     // Get user details
// //     console.log('Fetching user details...');
// //     const userDoc = await db.collection('users').doc(order.userId).get();
// //     const user = userDoc.exists ? userDoc.data() : {};
// //     console.log('User data:', JSON.stringify(user, null, 2));
    
// //     // Generate invoice number with fallback
// //     const invoiceNumber = `INV-${order.orderNumber || orderId}-${Date.now().toString().slice(-6)}`;
// //     console.log('Generated invoice number:', invoiceNumber);
    
// //     // Create PDF document with page buffering
// //     console.log('Creating PDF document...');
// //     doc = new PDFDocument({
// //       size: 'A4',
// //       margin: 50,
// //       bufferPages: true  // Enable page buffering to handle multi-page footers
// //     });
    
// //     // Set response headers for PDF download
// //     res.setHeader('Content-Type', 'application/pdf');
// //     res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber || orderId}.pdf"`);
    
// //     // Pipe PDF to response
// //     doc.pipe(res);
    
// //     console.log('Adding content to PDF...');
// //     // Add company header with logo
// //     addCompanyHeader(doc);
    
// //     // Add invoice details with correct alignment and Indian date format
// //     addInvoiceDetails(doc, invoiceNumber, order);
    
// //     // Add customer information
// //     addCustomerInfo(doc, user, order.shippingAddress);
    
// //     // Add order items table with updated structure
// //     addOrderItemsTable(doc, order);
    
// //     // Add totals and payment information
// //     addTotalsAndPayment(doc, order);
    
// //     // Add footer to all pages
// //     addFooter(doc);
    
// //     // Finalize PDF
// //     console.log('Finalizing PDF...');
// //     doc.end();
    
// //     console.log('PDF generation completed successfully');
    
// //   } catch (error) {
// //     console.error('=== Invoice Download Error ===');
// //     console.error('Error details:', error);
    
// //     if (doc) {
// //       try {
// //         doc.end();
// //       } catch (docError) {
// //         console.error('Error cleaning up PDF document:', docError);
// //       }
// //     }
    
// //     if (!res.headersSent) {
// //       res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
// //     }
// //   }
// // });



// // Generate and download invoice for an order
// router.get('/:orderId/download', authenticateToken, async (req, res) => {
//   let doc = null;
  
//   try {
//     console.log('=== Invoice Download Request ===');
//     console.log('Order ID:', req.params.orderId);
//     console.log('User:', req.user);
    
//     const { orderId } = req.params;
    
//     // Get order details
//     console.log('Fetching order from database...');
//     const orderDoc = await db.collection('orders').doc(orderId).get();
    
//     if (!orderDoc.exists) {
//       console.log('Order not found');
//       return res.status(404).json({ error: 'Order not found' });
//     }
    
//     const order = orderDoc.data();
//     console.log('Order data:', JSON.stringify(order, null, 2));
    
//     // Check if user owns this order or is admin
//     if (order.userId !== req.user.uid && req.user.role !== 'admin') {
//       console.log('Unauthorized access - User ID:', req.user.uid, 'Order User ID:', order.userId);
//       return res.status(403).json({ error: 'Unauthorized access' });
//     }
    
//     // Get user details
//     console.log('Fetching user details...');
//     const userDoc = await db.collection('users').doc(order.userId).get();
//     const user = userDoc.exists ? userDoc.data() : {};
//     console.log('User data:', JSON.stringify(user, null, 2));
    
//     // Generate invoice number with fallback
//     const invoiceNumber = `INV-${order.orderNumber || orderId}-${Date.now().toString().slice(-6)}`;
//     console.log('Generated invoice number:', invoiceNumber);
    
//     // Create PDF document with page buffering
//     console.log('Creating PDF document...');
//     doc = new PDFDocument({
//       size: 'A4',
//       margin: 50,
//       bufferPages: true  // Enable page buffering to handle multi-page footers
//     });
    
//     // Set response headers for PDF download
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber || orderId}.pdf"`);
    
//     // Pipe PDF to response
//     doc.pipe(res);
    
//     console.log('Adding content to PDF...');
//     // Add company header with logo
//     await addCompanyHeader(doc);
    
//     // Add invoice details with correct alignment and Indian date format
//     addInvoiceDetails(doc, invoiceNumber, order);
    
//     // Add customer information
//     addCustomerInfo(doc, user, order.shippingAddress);
    
//     // Add order items table with updated structure
//     addOrderItemsTable(doc, order);
    
//     // Add totals and payment information
//     addTotalsAndPayment(doc, order);
    
//     // Add footer to all pages
//     addFooter(doc);
    
//     // Finalize PDF
//     console.log('Finalizing PDF...');
//     doc.end();
    
//     console.log('PDF generation completed successfully');
    
//   } catch (error) {
//     console.error('=== Invoice Download Error ===');
//     console.error('Error details:', error);
    
//     if (doc) {
//       try {
//         doc.end();
//       } catch (docError) {
//         console.error('Error cleaning up PDF document:', docError);
//       }
//     }
    
//     if (!res.headersSent) {
//       res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
//     }
//   }
// });


// // Get invoice details (without download)
// router.get('/:orderId', authenticateToken, async (req, res) => {
//   try {
//     console.log('=== Invoice Details Request ===');
//     console.log('Order ID:', req.params.orderId);
//     console.log('User:', req.user);
    
//     const { orderId } = req.params;
    
//     // Get order details
//     console.log('Fetching order from database...');
//     const orderDoc = await db.collection('orders').doc(orderId).get();
    
//     if (!orderDoc.exists) {
//       console.log('Order not found');
//       return res.status(404).json({ error: 'Order not found' });
//     }
    
//     const order = orderDoc.data();
//     console.log('Order data:', JSON.stringify(order, null, 2));
    
//     // Check if user owns this order or is admin
//     if (order.userId !== req.user.uid && req.user.role !== 'admin') {
//       console.log('Unauthorized access - User ID:', req.user.uid, 'Order User ID:', order.userId);
//       return res.status(403).json({ error: 'Unauthorized access' });
//     }
    
//     // Get user details
//     console.log('Fetching user details...');
//     const userDoc = await db.collection('users').doc(order.userId).get();
//     const user = userDoc.exists ? userDoc.data() : {};
//     console.log('User data:', JSON.stringify(user, null, 2));
    
//     // Generate invoice number with fallback
//     const invoiceNumber = `INV-${order.orderNumber || orderId}-${Date.now().toString().slice(-6)}`;
//     console.log('Generated invoice number:', invoiceNumber);
    
//     // Prepare invoice data with defensive programming
//     const firstName = user.firstName || '';
//     const lastName = user.lastName || '';
//     const customerName = firstName && lastName ? `${firstName} ${lastName}`.trim() : 
//                         user.name || user.displayName || 'Customer';
    
//     const invoiceData = {
//       invoiceNumber,
//       orderNumber: order.orderNumber || orderId,
//       orderDate: order.createdAt || new Date().toISOString(),
//       customerName,
//       customerEmail: user.email || 'N/A',
//       customerPhone: user.phone || 'N/A',
//       shippingAddress: order.shippingAddress || {},
//       items: order.items || [],
//       subtotal: order.subtotal || 0,
//       sgstAmount: order.sgstAmount || 0,
//       cgstAmount: order.cgstAmount || 0,
//       gstAmount: order.gstAmount || 0,
//       deliveryCharge: order.deliveryCharge || 0,
//       discountAmount: order.discountAmount || 0,
//       finalAmount: order.finalAmount || 0,
//       paymentMethod: order.paymentMethod || 'N/A',
//       status: order.status || 'pending'
//     };
    
//     console.log('Invoice data prepared successfully');
//     res.json({ invoice: invoiceData });
    
//   } catch (error) {
//     console.error('=== Invoice Details Error ===');
//     console.error('Error details:', error);
//     console.error('Error stack:', error.stack);
//     console.error('Error message:', error.message);
//     res.status(500).json({ error: 'Failed to fetch invoice', details: error.message });
//   }
// });

// // Helper function to add company header
// // Helper function to add company header with logo
// // Helper function to add company header with logo (async for fetching remote image)
// async function addCompanyHeader(doc) {
//   let currentY = 50;

//   // Try to fetch remote logo
//   try {
//     const logoUrl = 'https://cdn-icons-png.flaticon.com/512/2936/2936705.png';  // Green Ayurveda-themed logo from Flaticon
//     const response = await fetch(logoUrl);
//     if (response.ok) {
//       const buffer = await response.buffer();
//       doc.image(buffer, 50, currentY, { width: 100 });
//       currentY += 110;  // Space after logo
//     } else {
//       throw new Error('Failed to fetch logo');
//     }
//   } catch (error) {
//     console.error('Logo fetch error:', error);
//     // Fallback to local file if remote fails
//     const logoPath = path.join(__dirname, '../public/ayur4life-logo.png');
//     if (fs.existsSync(logoPath)) {
//       doc.image(logoPath, 50, currentY, { width: 100 });
//       currentY += 110;
//     } else {
//       // Fallback to styled text logo
//       doc.fontSize(24)
//          .font('Helvetica-Bold')
//          .fillColor('#198754')
//          .text('Ayur4Life', 50, currentY, { align: 'left' });
//       currentY += 30;
//       doc.fontSize(12)
//          .font('Helvetica')
//          .fillColor('#666')
//          .text('Your Wellness Partner', 50, currentY);
//       currentY += 20;
//     }
//   }

//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666')
//      .text('Thekkekara Arcade Chelakottukara Thrissur 680005', 50, currentY);
//   currentY += 15;
//   doc.text('Phone: +91 9565852565 | Email: ayur4life@gmail.com', 50, currentY);

//   // Add line separator
//   doc.moveTo(50, currentY + 20)
//      .lineTo(550, currentY + 20)
//      .strokeColor('#198754')
//      .lineWidth(2)
//      .stroke();

//   return currentY + 40;  // Return updated Y
// }

// // Helper function to add invoice details with improved alignment
// function addInvoiceDetails(doc, invoiceNumber, order) {
//   let currentY = 50;
//   const labelX = 350;  // Fixed X for labels
//   const valueX = 550;  // Fixed X for values, with right align

//   doc.fontSize(18)
//      .font('Helvetica-Bold')
//      .fillColor('#198754')
//      .text('INVOICE', 400, currentY, { align: 'right' });
//   currentY += 30;

//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666');
//   doc.text('Invoice Number:', labelX, currentY);
//   doc.text(invoiceNumber, valueX - 150, currentY, { width: 150, align: 'right' });
//   currentY += 15;
//   doc.text('Order Number:', labelX, currentY);
//   doc.text(order.orderNumber || 'N/A', valueX - 150, currentY, { width: 150, align: 'right' });
//   currentY += 15;
//   doc.text('Date:', labelX, currentY);
//   doc.text(new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), valueX - 150, currentY, { width: 150, align: 'right' });
//   currentY += 15;
//   doc.text('Status:', labelX, currentY);
//   doc.text(order.status.toUpperCase() || 'PENDING', valueX - 150, currentY, { width: 150, align: 'right' });
// }

// // Helper function to add customer info with better alignment
// function addCustomerInfo(doc, user, shippingAddress) {
//   let currentY = 150;  // Adjusted to avoid overlap with header

//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor('#198754')
//      .text('Bill To:', 50, currentY);
//   currentY += 20;
//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666')
//      .text(`${user.firstName || ''} ${user.lastName || ''}`, 50, currentY);
//   currentY += 15;
//   doc.text(user.email || '', 50, currentY);
//   currentY += 15;
//   doc.text(user.phone || '', 50, currentY);
//   currentY += 15;
//   doc.text(`${shippingAddress.street || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`, 50, currentY, { width: 200 });

//   currentY = 150;  // Reset for Ship To
//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor('#198754')
//      .text('Ship To:', 300, currentY);
//   currentY += 20;
//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666')
//      .text(shippingAddress.name || `${user.firstName} ${user.lastName}`, 300, currentY);
//   currentY += 15;
//   doc.text(shippingAddress.street || '', 300, currentY);
//   currentY += 15;
//   doc.text(`${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`, 300, currentY, { width: 200 });
// }

// // Helper function to add order items table with updates
// function addOrderItemsTable(doc, order) {
//   let currentY = 250;  // Adjusted start Y to fit after customer info
//   const subtotal = order.subtotal || 0;
//   const discountAmount = order.discountAmount || 0;
//   const sgstAmount = order.sgstAmount || 0;
//   const cgstAmount = order.cgstAmount || 0;
//   const gstAmount = order.gstAmount || 0;
//   const hasDiscount = discountAmount > 0;
//   const hasSgst = sgstAmount > 0;
//   const hasCgst = cgstAmount > 0;
//   const hasGst = gstAmount > 0;

//   // Prorate rates
//   const totalTaxable = subtotal - discountAmount;
//   const discountRate = subtotal > 0 ? discountAmount / subtotal : 0;
//   const sgstRate = totalTaxable > 0 ? sgstAmount / totalTaxable : 0;
//   const cgstRate = totalTaxable > 0 ? cgstAmount / totalTaxable : 0;
//   const gstRate = totalTaxable > 0 ? gstAmount / totalTaxable : 0;

//   // Add table heading
//   doc.fontSize(14)
//      .font('Helvetica-Bold')
//      .fillColor('#198754')
//      .text('Item Details', 50, currentY);
//   currentY += 20;

//   // Define column widths for alignment
//   const colWidths = {
//     slNo: 40,
//     itemName: 120,
//     qty: 40,
//     rate: 60,
//     discount: 60,
//     taxable: 80,
//     sgst: 60,
//     cgst: 60,
//     gst: 60,
//     total: 60
//   };

//   // Draw header row
//   doc.fontSize(10)
//      .font('Helvetica-Bold')
//      .fillColor('#333');
//   let colX = 50;
//   doc.text('Sl No', colX, currentY, { width: colWidths.slNo, align: 'left' }); colX += colWidths.slNo;
//   doc.text('Item Name', colX, currentY, { width: colWidths.itemName, align: 'left' }); colX += colWidths.itemName;
//   doc.text('Qty', colX, currentY, { width: colWidths.qty, align: 'right' }); colX += colWidths.qty;
//   doc.text('Rate', colX, currentY, { width: colWidths.rate, align: 'right' }); colX += colWidths.rate;
//   if (hasDiscount) {
//     doc.text('Discount', colX, currentY, { width: colWidths.discount, align: 'right' }); colX += colWidths.discount;
//   }
//   doc.text('Taxable Value', colX, currentY, { width: colWidths.taxable, align: 'right' }); colX += colWidths.taxable;
//   if (hasSgst) {
//     doc.text('SGST', colX, currentY, { width: colWidths.sgst, align: 'right' }); colX += colWidths.sgst;
//   }
//   if (hasCgst) {
//     doc.text('CGST', colX, currentY, { width: colWidths.cgst, align: 'right' }); colX += colWidths.cgst;
//   }
//   if (hasGst) {
//     doc.text('GST', colX, currentY, { width: colWidths.gst, align: 'right' }); colX += colWidths.gst;
//   }
//   doc.text('Total', colX, currentY, { width: colWidths.total, align: 'right' });

//   currentY += 20;
//   doc.moveTo(50, currentY - 5)
//      .lineTo(550, currentY - 5)
//      .strokeColor('#198754')
//      .lineWidth(1)
//      .stroke();

//   // Add items
//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666');
//   order.items.forEach((item, index) => {
//     if (currentY > 650) {
//       doc.addPage();
//       currentY = 50;
//       // Redraw heading and header on new page
//       doc.fontSize(14)
//          .font('Helvetica-Bold')
//          .fillColor('#198754')
//          .text('Item Details (Continued)', 50, currentY);
//       currentY += 20;
//       let headerX = 50;
//       doc.fontSize(10)
//          .font('Helvetica-Bold')
//          .fillColor('#333');
//       doc.text('Sl No', headerX, currentY, { width: colWidths.slNo, align: 'left' }); headerX += colWidths.slNo;
//       doc.text('Item Name', headerX, currentY, { width: colWidths.itemName, align: 'left' }); headerX += colWidths.itemName;
//       doc.text('Qty', headerX, currentY, { width: colWidths.qty, align: 'right' }); headerX += colWidths.qty;
//       doc.text('Rate', headerX, currentY, { width: colWidths.rate, align: 'right' }); headerX += colWidths.rate;
//       if (hasDiscount) {
//         doc.text('Discount', headerX, currentY, { width: colWidths.discount, align: 'right' }); headerX += colWidths.discount;
//       }
//       doc.text('Taxable Value', headerX, currentY, { width: colWidths.taxable, align: 'right' }); headerX += colWidths.taxable;
//       if (hasSgst) {
//         doc.text('SGST', headerX, currentY, { width: colWidths.sgst, align: 'right' }); headerX += colWidths.sgst;
//       }
//       if (hasCgst) {
//         doc.text('CGST', headerX, currentY, { width: colWidths.cgst, align: 'right' }); headerX += colWidths.cgst;
//       }
//       if (hasGst) {
//         doc.text('GST', headerX, currentY, { width: colWidths.gst, align: 'right' }); headerX += colWidths.gst;
//       }
//       doc.text('Total', headerX, currentY, { width: colWidths.total, align: 'right' });
//       currentY += 20;
//       doc.moveTo(50, currentY - 5)
//          .lineTo(550, currentY - 5)
//          .strokeColor('#198754')
//          .lineWidth(1)
//          .stroke();
//     }

//     const itemAmount = item.quantity * item.unitPrice;
//     const proratedDiscount = itemAmount * discountRate;
//     const taxable = itemAmount - proratedDiscount;
//     const proratedSgst = taxable * sgstRate;
//     const proratedCgst = taxable * cgstRate;
//     const proratedGst = taxable * gstRate;
//     const itemTotal = taxable + proratedSgst + proratedCgst + proratedGst;

//     let colX = 50;
//     doc.text((index + 1).toString(), colX, currentY, { width: colWidths.slNo, align: 'left' }); colX += colWidths.slNo;
//     doc.text(item.productName || 'Item', colX, currentY, { width: colWidths.itemName, align: 'left' }); colX += colWidths.itemName;
//     doc.text(item.quantity.toString(), colX, currentY, { width: colWidths.qty, align: 'right' }); colX += colWidths.qty;
//     doc.text(`₹${item.unitPrice.toFixed(2)}`, colX, currentY, { width: colWidths.rate, align: 'right' }); colX += colWidths.rate;
//     if (hasDiscount) {
//       doc.text(`₹${proratedDiscount.toFixed(2)}`, colX, currentY, { width: colWidths.discount, align: 'right' }); colX += colWidths.discount;
//     }
//     doc.text(`₹${taxable.toFixed(2)}`, colX, currentY, { width: colWidths.taxable, align: 'right' }); colX += colWidths.taxable;
//     if (hasSgst) {
//       doc.text(`₹${proratedSgst.toFixed(2)}`, colX, currentY, { width: colWidths.sgst, align: 'right' }); colX += colWidths.sgst;
//     }
//     if (hasCgst) {
//       doc.text(`₹${proratedCgst.toFixed(2)}`, colX, currentY, { width: colWidths.cgst, align: 'right' }); colX += colWidths.cgst;
//     }
//     if (hasGst) {
//       doc.text(`₹${proratedGst.toFixed(2)}`, colX, currentY, { width: colWidths.gst, align: 'right' }); colX += colWidths.gst;
//     }
//     doc.text(`₹${itemTotal.toFixed(2)}`, colX, currentY, { width: colWidths.total, align: 'right' });

//     currentY += 20;
//     doc.moveTo(50, currentY - 5)
//        .lineTo(550, currentY - 5)
//        .strokeColor('#ddd')
//        .lineWidth(0.5)
//        .stroke();
//   });

//   return currentY + 20;  // Return next Y position for totals
// }

// // Helper function to add totals and payment
// function addTotalsAndPayment(doc, order) {
//   let currentY = addOrderItemsTable(doc, order);

//   const subtotal = order.subtotal || 0;
//   const discountAmount = order.discountAmount || 0;
//   const sgstAmount = order.sgstAmount || 0;
//   const cgstAmount = order.cgstAmount || 0;
//   const gstAmount = order.gstAmount || 0;
//   const deliveryCharge = order.deliveryCharge || 0;
//   const finalAmount = order.finalAmount || 0;
//   const paymentMethod = order.paymentMethod || 'N/A';

//   // Calculate required height to avoid new page mid-totals
//   let itemCount = 2;  // Subtotal + Total
//   if (discountAmount > 0) itemCount++;
//   if (sgstAmount > 0) itemCount++;
//   if (cgstAmount > 0) itemCount++;
//   if (gstAmount > 0) itemCount++;
//   if (deliveryCharge > 0) itemCount++;
//   const requiredHeight = (itemCount * 20) + 60;  // + payment + buffers

//   if (currentY + requiredHeight > doc.page.height - 150) {  // Leave space for footer
//     doc.addPage();
//     currentY = 50;
//   }

//   const labelX = 350;
//   const valueX = 550;

//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666');

//   doc.text('Subtotal:', labelX, currentY);
//   doc.text(`₹${subtotal.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
//   currentY += 20;

//   if (discountAmount > 0) {
//     doc.text('Discount:', labelX, currentY);
//     doc.text(`-₹${discountAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
//     currentY += 20;
//   }

//   if (sgstAmount > 0) {
//     doc.text('SGST:', labelX, currentY);
//     doc.text(`₹${sgstAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
//     currentY += 20;
//   }

//   if (cgstAmount > 0) {
//     doc.text('CGST:', labelX, currentY);
//     doc.text(`₹${cgstAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
//     currentY += 20;
//   }

//   if (gstAmount > 0) {
//     doc.text('GST:', labelX, currentY);
//     doc.text(`₹${gstAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
//     currentY += 20;
//   }

//   if (deliveryCharge > 0) {
//     doc.text('Delivery Charge:', labelX, currentY);
//     doc.text(`₹${deliveryCharge.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
//     currentY += 20;
//   }

//   // Line before total
//   doc.moveTo(labelX, currentY + 5)
//      .lineTo(550, currentY + 5)
//      .strokeColor('#198754')
//      .lineWidth(2)
//      .stroke();
//   currentY += 15;

//   // Total
//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor('#198754');
//   doc.text('Total Amount:', labelX, currentY);
//   doc.text(`₹${finalAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });

//   // Payment method
//   currentY += 30;
//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666');
//   doc.text(`Payment Method: ${paymentMethod}`, 50, currentY);
// }

// // Helper function to add footer to all pages
// function addFooter(doc) {
//   const range = doc.bufferedPageRange();
//   for (let i = 0; i < range.count; i++) {
//     doc.switchToPage(i);
//     const pageHeight = doc.page.height;
//     const footerY = pageHeight - 100;

//     // Decorative line
//     doc.moveTo(50, footerY)
//        .lineTo(550, footerY)
//        .strokeColor('#198754')
//        .lineWidth(1)
//        .stroke();

//     // Footer
//     doc.fontSize(10)
//        .font('Helvetica-Bold')
//        .fillColor('#198754')
//        .text('Thank you for choosing Ayur4Life!', 50, footerY + 15, { align: 'center', width: 500 });

//     doc.fontSize(8)
//        .font('Helvetica')
//        .fillColor('#666')
//        .text('For any questions, please contact us at info@ayur4life.com', 50, footerY + 35, { align: 'center', width: 500 });
//     doc.text(`Page ${i + 1} of ${range.count}`, 50, footerY + 55, { align: 'center', width: 500 });
//   }
// }

// module.exports = router; 

const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Invoice routes are working', 
    timestamp: new Date().toISOString(),
    pdfkit: typeof PDFDocument !== 'undefined' ? 'Available' : 'Not available'
  });
});

// Simple test endpoint without auth
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Test PDF generation without authentication
router.get('/test-pdf', (req, res) => {
  try {
    console.log('Testing PDF generation...');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    
    doc.pipe(res);
    doc.text('Test PDF - Invoice system is working!', 50, 50);
    doc.end();
    
    console.log('Test PDF generated successfully');
  } catch (error) {
    console.error('Test PDF error:', error);
    res.status(500).json({ error: 'Test PDF failed', details: error.message });
  }
});

// // Generate and download invoice for an order
// router.get('/:orderId/download', authenticateToken, async (req, res) => {
//   let doc = null;
  
//   try {
//     console.log('=== Invoice Download Request ===');
//     console.log('Order ID:', req.params.orderId);
//     console.log('User:', req.user);
    
//     const { orderId } = req.params;
    
//     // Get order details
//     console.log('Fetching order from database...');
//     const orderDoc = await db.collection('orders').doc(orderId).get();
    
//     if (!orderDoc.exists) {
//       console.log('Order not found');
//       return res.status(404).json({ error: 'Order not found' });
//     }
    
//     const order = orderDoc.data();
//     console.log('Order data:', JSON.stringify(order, null, 2));
    
//     // Check if user owns this order or is admin
//     if (order.userId !== req.user.uid && req.user.role !== 'admin') {
//       console.log('Unauthorized access - User ID:', req.user.uid, 'Order User ID:', order.userId);
//       return res.status(403).json({ error: 'Unauthorized access' });
//     }
    
//     // Get user details
//     console.log('Fetching user details...');
//     const userDoc = await db.collection('users').doc(order.userId).get();
//     const user = userDoc.exists ? userDoc.data() : {};
//     console.log('User data:', JSON.stringify(user, null, 2));
    
//     // Generate invoice number with fallback
//     const invoiceNumber = `INV-${order.orderNumber || orderId}-${Date.now().toString().slice(-6)}`;
//     console.log('Generated invoice number:', invoiceNumber);
    
//     // Create PDF document with page buffering
//     console.log('Creating PDF document...');
//     doc = new PDFDocument({
//       size: 'A4',
//       margin: 50,
//       bufferPages: true  // Enable page buffering to handle multi-page footers
//     });
    
//     // Set response headers for PDF download
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber || orderId}.pdf"`);
    
//     // Pipe PDF to response
//     doc.pipe(res);
    
//     console.log('Adding content to PDF...');
//     // Add company header with logo
//     addCompanyHeader(doc);
    
//     // Add invoice details with correct alignment and Indian date format
//     addInvoiceDetails(doc, invoiceNumber, order);
    
//     // Add customer information
//     addCustomerInfo(doc, user, order.shippingAddress);
    
//     // Add order items table with updated structure
//     addOrderItemsTable(doc, order);
    
//     // Add totals and payment information
//     addTotalsAndPayment(doc, order);
    
//     // Add footer to all pages
//     addFooter(doc);
    
//     // Finalize PDF
//     console.log('Finalizing PDF...');
//     doc.end();
    
//     console.log('PDF generation completed successfully');
    
//   } catch (error) {
//     console.error('=== Invoice Download Error ===');
//     console.error('Error details:', error);
    
//     if (doc) {
//       try {
//         doc.end();
//       } catch (docError) {
//         console.error('Error cleaning up PDF document:', docError);
//       }
//     }
    
//     if (!res.headersSent) {
//       res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
//     }
//   }
// });



// Generate and download invoice for an order
router.get('/:orderId/download', authenticateToken, async (req, res) => {
  let doc = null;
  
  try {
    console.log('=== Invoice Download Request ===');
    console.log('Order ID:', req.params.orderId);
    console.log('User:', req.user);
    
    const { orderId } = req.params;
    
    // Get order details
    console.log('Fetching order from database...');
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log('Order not found');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    console.log('Order data:', JSON.stringify(order, null, 2));
    
    // Check if user owns this order or is admin
    if (order.userId !== req.user.uid && req.user.role !== 'admin') {
      console.log('Unauthorized access - User ID:', req.user.uid, 'Order User ID:', order.userId);
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get user details
    console.log('Fetching user details...');
    const userDoc = await db.collection('users').doc(order.userId).get();
    const user = userDoc.exists ? userDoc.data() : {};
    console.log('User data:', JSON.stringify(user, null, 2));
    
    // Generate invoice number with fallback
    const invoiceNumber = `INV-${order.orderNumber || orderId}-${Date.now().toString().slice(-6)}`;
    console.log('Generated invoice number:', invoiceNumber);
    
    // Create PDF document with page buffering
    console.log('Creating PDF document...');
    doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true  // Enable page buffering to handle multi-page footers
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber || orderId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    console.log('Adding content to PDF...');
    // Add company header with logo
    await addCompanyHeader(doc);
    
    // Add invoice details with correct alignment and Indian date format
    addInvoiceDetails(doc, invoiceNumber, order);
    
    // Add customer information
    addCustomerInfo(doc, user, order.shippingAddress);
    
    // Add order items table with updated structure
    addOrderItemsTable(doc, order);
    
    // Add totals and payment information
    addTotalsAndPayment(doc, order);
    
    // Add footer to all pages
    addFooter(doc);
    
    // Finalize PDF
    console.log('Finalizing PDF...');
    doc.end();
    
    console.log('PDF generation completed successfully');
    
  } catch (error) {
    console.error('=== Invoice Download Error ===');
    console.error('Error details:', error);
    
    if (doc) {
      try {
        doc.end();
      } catch (docError) {
        console.error('Error cleaning up PDF document:', docError);
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
    }
  }
});


// Get invoice details (without download)
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    console.log('=== Invoice Details Request ===');
    console.log('Order ID:', req.params.orderId);
    console.log('User:', req.user);
    
    const { orderId } = req.params;
    
    // Get order details
    console.log('Fetching order from database...');
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log('Order not found');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    console.log('Order data:', JSON.stringify(order, null, 2));
    
    // Check if user owns this order or is admin
    if (order.userId !== req.user.uid && req.user.role !== 'admin') {
      console.log('Unauthorized access - User ID:', req.user.uid, 'Order User ID:', order.userId);
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get user details
    console.log('Fetching user details...');
    const userDoc = await db.collection('users').doc(order.userId).get();
    const user = userDoc.exists ? userDoc.data() : {};
    console.log('User data:', JSON.stringify(user, null, 2));
    
    // Generate invoice number with fallback
    const invoiceNumber = `INV-${order.orderNumber || orderId}-${Date.now().toString().slice(-6)}`;
    console.log('Generated invoice number:', invoiceNumber);
    
    // Prepare invoice data with defensive programming
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const customerName = firstName && lastName ? `${firstName} ${lastName}`.trim() : 
                        user.name || user.displayName || 'Customer';
    
    const invoiceData = {
      invoiceNumber,
      orderNumber: order.orderNumber || orderId,
      orderDate: order.createdAt || new Date().toISOString(),
      customerName,
      customerEmail: user.email || 'N/A',
      customerPhone: user.phone || 'N/A',
      shippingAddress: order.shippingAddress || {},
      items: order.items || [],
      subtotal: order.subtotal || 0,
      sgstAmount: order.sgstAmount || 0,
      cgstAmount: order.cgstAmount || 0,
      gstAmount: order.gstAmount || 0,
      deliveryCharge: order.deliveryCharge || 0,
      discountAmount: order.discountAmount || 0,
      finalAmount: order.finalAmount || 0,
      paymentMethod: order.paymentMethod || 'N/A',
      status: order.status || 'pending'
    };
    
    console.log('Invoice data prepared successfully');
    res.json({ invoice: invoiceData });
    
  } catch (error) {
    console.error('=== Invoice Details Error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ error: 'Failed to fetch invoice', details: error.message });
  }
});

// Helper function to add company header
// Helper function to add company header with logo
// Helper function to add company header with logo (async for fetching remote image)
// async function addCompanyHeader(doc) {
//   let currentY = 50;

//   // Try to fetch remote logo
//   try {
//     // const logoUrl = 'https://cdn-icons-png.flaticon.com/512/2936/2936705.png';  // Green Ayurveda-themed logo from Flaticon
//     // const response = await fetch(logoUrl);
//     if (response.ok) {
//       // const buffer = await response.buffer();
//       // doc.image(buffer, 50, currentY, { width: 100 });
//       currentY += 200;  // Space after logo
//     } else {
//       throw new Error('Failed to fetch logo');
//     }
//   } catch (error) {
//     console.error('Logo fetch error:', error);
//     // Fallback to local file if remote fails
//     const logoPath = path.join(__dirname, '../public/images/Ayur4life_logo_round_png-01.png');
//     if (fs.existsSync(logoPath)) {
//       doc.image(logoPath, 50, currentY, { width: 100 });
//       currentY += 110;
//     } else {
//       // Fallback to styled text logo
//       doc.fontSize(24)
//          .font('Helvetica-Bold')
//          .fillColor('#198754')
//          .text('Ayur4Life', 50, currentY, { align: 'left' });
//       currentY += 30;
//       doc.fontSize(12)
//          .font('Helvetica')
//          .fillColor('#666')
//          .text('Your Wellness Partner', 50, currentY);
//       currentY += 20;
//     }
//   }

//   doc.fontSize(10)
//      .font('Helvetica')
//      .fillColor('#666')
//      .text('Thekkekara Arcade Chelakottukara Thrissur 680005', 50, currentY);
//   currentY += 15;
//   doc.text('Phone: +91 9565852565 | Email: ayur4life@gmail.com', 50, currentY);

//   // Add line separator
//   doc.moveTo(50, currentY + 20)
//      .lineTo(550, currentY + 20)
//      .strokeColor('#198754')
//      .lineWidth(2)
//      .stroke();

//   return currentY + 40;  // Return updated Y
// }

// Helper function to add company header with logo
function addCompanyHeader(doc) {
  let currentY = 50;

  try {
    // Path to your uploaded logo inside server/public/images
    const logoPath = path.join(__dirname, "../public/images/Ayur4life_logo_round_png-01.png");

    if (fs.existsSync(logoPath)) {
      // Insert logo if file exists
      doc.image(logoPath, 50, currentY, { width: 100 });
      currentY += 110;
    } else {
      // If logo not found, fallback to styled text
      doc.fontSize(24)
         .font("Helvetica-Bold")
         .fillColor("#198754")
         .text("Ayur4Life", 50, currentY);
      currentY += 30;

      doc.fontSize(12)
         .font("Helvetica")
         .fillColor("#666")
         .text("Your Wellness Partner", 50, currentY);
      currentY += 20;
    }
  } catch (error) {
    console.error("Logo load error:", error);
  }

  // Company details under logo
  doc.fontSize(10)
     .font("Helvetica")
     .fillColor("#666")
     .text("Thekkekara Arcade Chelakottukara Thrissur 680005", 50, currentY);
  currentY += 15;
  doc.text("Phone: +91 9565852565 | Email: ayur4life@gmail.com", 50, currentY);

  // Separator line
  doc.moveTo(50, currentY + 20)
     .lineTo(550, currentY + 20)
     .strokeColor("#198754")
     .lineWidth(2)
     .stroke();

  return currentY + 40;
}


// Helper function to add invoice details with improved alignment
function addInvoiceDetails(doc, invoiceNumber, order) {
  let currentY = 40;
  const labelX = 338;  // Fixed X for labels
  const valueX = 540;  // Fixed X for values, with right align

  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#198754')
     .text('INVOICE', 400, currentY, { align: 'right' });
  currentY += 30;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666');
  doc.text('Invoice Number:', labelX, currentY);
  doc.text(invoiceNumber, valueX - 150, currentY, { width: 159, align: 'right' });
  currentY += 15;
  doc.text('Order Number:', labelX, currentY);
  doc.text(order.orderNumber || 'N/A', valueX - 150, currentY, { width: 159, align: 'right' });
  currentY += 15;
  doc.text('Date:', labelX, currentY);
  doc.text(new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), valueX - 150, currentY, { width: 159, align: 'right' });
  currentY += 15;
  doc.text('Status:', labelX, currentY);
  doc.text(order.status.toUpperCase() || 'PENDING', valueX - 150, currentY, { width: 159, align: 'right' });
}

// Helper function to add customer info with better alignment
function addCustomerInfo(doc, user, shippingAddress) {
  let currentY = 230;  // Adjusted to avoid overlap with header

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#198754')
     .text('Bill To:', 50, currentY);
  currentY += 20;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666')
     .text(`${user.firstName || ''} ${user.lastName || ''}`, 50, currentY);
  currentY += 15;
  doc.text(user.email || '', 50, currentY);
  currentY += 15;
  doc.text(user.phone || '', 50, currentY);
  currentY += 15;
  doc.text(`${shippingAddress.street || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`, 50, currentY, { width: 200 });

  currentY = 230;  // Reset for Ship To
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#198754')
     .text('Ship To:', 338, currentY);
  currentY += 20;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666')
     .text(shippingAddress.name || `${user.firstName} ${user.lastName}`, 338, currentY);
  currentY += 15;
  doc.text(shippingAddress.street || '', 338, currentY);
  currentY += 15;
  doc.text(`${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`, 338, currentY, { width: 200 });
}

// Helper function to add order items table with updates
function addOrderItemsTable(doc, order) {
  let currentY = 330;  // Adjusted start Y to fit after customer info
  const subtotal = order.subtotal || 0;
  const discountAmount = order.discountAmount || 0;
  const sgstAmount = order.sgstAmount || 0;
  const cgstAmount = order.cgstAmount || 0;
  const gstAmount = order.gstAmount || 0;
  const hasDiscount = discountAmount > 0;
  const hasSgst = sgstAmount > 0;
  const hasCgst = cgstAmount > 0;
  const hasGst = gstAmount > 0;

  // Prorate rates
  const totalTaxable = subtotal - discountAmount;
  const discountRate = subtotal > 0 ? discountAmount / subtotal : 0;
  const sgstRate = totalTaxable > 0 ? sgstAmount / totalTaxable : 0;
  const cgstRate = totalTaxable > 0 ? cgstAmount / totalTaxable : 0;
  const gstRate = totalTaxable > 0 ? gstAmount / totalTaxable : 0;

  // Add table heading
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#198754')
     .text('Item Details', 50, currentY);
  currentY += 30;

  // Define column widths for alignment
  const colWidths = {
    slNo: 40,
    itemName: 100,
    qty: 50,
    rate: 60,
    discount: 60,
    // taxable: 80,
    // sgst: 60,
    // cgst: 60,
    gst: 60,
    total: 60
  };

  // Draw header row
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#333');
  let colX = 50;
  doc.text('Sl No', colX, currentY, { width: colWidths.slNo, align: 'left' }); colX += colWidths.slNo;
  doc.text('Item Name', colX, currentY, { width: colWidths.itemName, align: 'left' }); colX += colWidths.itemName;
  doc.text('Qty', colX, currentY, { width: colWidths.qty, align: 'right' }); colX += colWidths.qty;
  doc.text('Rate', colX, currentY, { width: colWidths.rate, align: 'right' }); colX += colWidths.rate;
  if (hasDiscount) {
    doc.text('Discount', colX, currentY, { width: colWidths.discount, align: 'right' }); colX += colWidths.discount;
  }
  // doc.text('Taxable Value', colX, currentY, { width: colWidths.taxable, align: 'right' }); colX += colWidths.taxable;
  // if (hasSgst) {
  //   doc.text('SGST', colX, currentY, { width: colWidths.sgst, align: 'right' }); colX += colWidths.sgst;
  // }
  // if (hasCgst) {
  //   doc.text('CGST', colX, currentY, { width: colWidths.cgst, align: 'right' }); colX += colWidths.cgst;
  // }
  if (hasGst) {
    doc.text(' Total GST', colX, currentY, { width: colWidths.gst, align: 'right' }); colX += colWidths.gst;
  }
  doc.text('Total', colX, currentY, { width: colWidths.total, align: 'right' });

  currentY += 20;
  doc.moveTo(50, currentY - 5)
     .lineTo(550, currentY - 5)
     .strokeColor('#198754')
     .lineWidth(1)
     .stroke();

  // Add items
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666');
  order.items.forEach((item, index) => {
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
      // Redraw heading and header on new page
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#198754')
         .text('Item Details (Continued)', 50, currentY);
      currentY += 20;
      let headerX = 50;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#333');
      doc.text('Sl No', headerX, currentY, { width: colWidths.slNo, align: 'left' }); headerX += colWidths.slNo;
      doc.text('Item Name', headerX, currentY, { width: colWidths.itemName, align: 'left' }); headerX += colWidths.itemName;
      doc.text('Qty', headerX, currentY, { width: colWidths.qty, align: 'right' }); headerX += colWidths.qty;
      doc.text('Rate', headerX, currentY, { width: colWidths.rate, align: 'right' }); headerX += colWidths.rate;
      if (hasDiscount) {
        doc.text('Discount', headerX, currentY, { width: colWidths.discount, align: 'right' }); headerX += colWidths.discount;
      }
      // doc.text('Taxable Value', headerX, currentY, { width: colWidths.taxable, align: 'right' }); headerX += colWidths.taxable;
      // if (hasSgst) {
      //   doc.text('SGST', headerX, currentY, { width: colWidths.sgst, align: 'right' }); headerX += colWidths.sgst;
      // }
      // if (hasCgst) {
      //   doc.text('CGST', headerX, currentY, { width: colWidths.cgst, align: 'right' }); headerX += colWidths.cgst;
      // }
      if (hasGst) {
        doc.text('Total GST', headerX, currentY, { width: colWidths.gst, align: 'right' }); headerX += colWidths.gst;
      }
      doc.text('Total', headerX, currentY, { width: colWidths.total, align: 'right' });
      currentY += 20;
      doc.moveTo(50, currentY - 5)
         .lineTo(550, currentY - 5)
         .strokeColor('#198754')
         .lineWidth(1)
         .stroke();
    }

    const itemAmount = item.quantity * item.unitPrice;
    const proratedDiscount = itemAmount * discountRate;
    const taxable = itemAmount - proratedDiscount;
    const proratedSgst = taxable * sgstRate;
    const proratedCgst = taxable * cgstRate;
    const proratedGst = taxable * gstRate;
    const itemTotal = taxable + proratedSgst + proratedCgst + proratedGst;

    let colX = 50;
    doc.text((index + 1).toString(), colX, currentY, { width: colWidths.slNo, align: 'left' }); colX += colWidths.slNo;
    doc.text(item.productName || 'Item', colX, currentY, { width: colWidths.itemName, align: 'left' }); colX += colWidths.itemName;
    doc.text(item.quantity.toString(), colX, currentY, { width: colWidths.qty, align: 'right' }); colX += colWidths.qty;
    doc.text(`₹${item.unitPrice.toFixed(2)}`, colX, currentY, { width: colWidths.rate, align: 'right' }); colX += colWidths.rate;
    if (hasDiscount) {
      doc.text(`₹${proratedDiscount.toFixed(2)}`, colX, currentY, { width: colWidths.discount, align: 'right' }); colX += colWidths.discount;
    }
    // doc.text(`₹${taxable.toFixed(2)}`, colX, currentY, { width: colWidths.taxable, align: 'right' }); colX += colWidths.taxable;
    // if (hasSgst) {
    //   doc.text(`₹${proratedSgst.toFixed(2)}`, colX, currentY, { width: colWidths.sgst, align: 'right' }); colX += colWidths.sgst;
    // }
    // if (hasCgst) {
    //   doc.text(`₹${proratedCgst.toFixed(2)}`, colX, currentY, { width: colWidths.cgst, align: 'right' }); colX += colWidths.cgst;
    // }
    if (hasGst) {
      doc.text(`₹${proratedGst.toFixed(2)}`, colX, currentY, { width: colWidths.gst, align: 'right' }); colX += colWidths.gst;
    }
    doc.text(`₹${itemTotal.toFixed(2)}`, colX, currentY, { width: colWidths.total, align: 'right' });

    currentY += 20;
    doc.moveTo(50, currentY - 5)
       .lineTo(550, currentY - 5)
       .strokeColor('#ddd')
       .lineWidth(0.5)
       .stroke();
  });

  return currentY + 20;  // Return next Y position for totals
}

// Helper function to add totals and payment
function addTotalsAndPayment(doc, order) {
  let currentY = addOrderItemsTable(doc, order);

  const subtotal = order.subtotal || 0;
  const discountAmount = order.discountAmount || 0;
  const sgstAmount = order.sgstAmount || 0;
  const cgstAmount = order.cgstAmount || 0;
  const gstAmount = order.gstAmount || 0;
  const deliveryCharge = order.deliveryCharge || 0;
  const finalAmount = order.finalAmount || 0;
  const paymentMethod = order.paymentMethod || 'N/A';

  // Calculate required height to avoid new page mid-totals
  let itemCount = 2;  // Subtotal + Total
  if (discountAmount > 0) itemCount++;
  if (sgstAmount > 0) itemCount++;
  if (cgstAmount > 0) itemCount++;
  if (gstAmount > 0) itemCount++;
  if (deliveryCharge > 0) itemCount++;
  const requiredHeight = (itemCount * 20) + 60;  // + payment + buffers

  if (currentY + requiredHeight > doc.page.height - 150) {  // Leave space for footer
    doc.addPage();
    currentY = 30;
  }

  const labelX = 350;
  const valueX = 540;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666');

  doc.text('Subtotal:', labelX, currentY);
  doc.text(`₹${subtotal.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
  currentY += 20;

  if (discountAmount > 0) {
    doc.text('Discount:', labelX, currentY);
    doc.text(`-₹${discountAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
    currentY += 20;
  }

  if (sgstAmount > 0) {
    doc.text('SGST:', labelX, currentY);
    doc.text(`₹${sgstAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
    currentY += 20;
  }

  if (cgstAmount > 0) {
    doc.text('CGST:', labelX, currentY);
    doc.text(`₹${cgstAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
    currentY += 20;
  }

  if (gstAmount > 0) {
    doc.text('Total GST:', labelX, currentY);
    doc.text(`₹${gstAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
    currentY += 20;
  }

  if (deliveryCharge > 0) {
    doc.text('Delivery Charge:', labelX, currentY);
    doc.text(`₹${deliveryCharge.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });
    currentY += 20;
  }

  // Line before total
  doc.moveTo(labelX, currentY + 5)
     .lineTo(550, currentY + 5)
     .strokeColor('#198754')
     .lineWidth(2)
     .stroke();
  currentY += 15;

  // Total
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#198754');
  doc.text('Total Amount:', labelX, currentY);
  doc.text(`₹${finalAmount.toFixed(2)}`, valueX - 80, currentY, { width: 80, align: 'right' });

  // Payment method
  currentY += 50;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666');
  doc.text(`Payment Method: ${paymentMethod}`, 50, currentY);
}

// Helper function to add footer to all pages
function addFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    // Decorative line
    doc.moveTo(50, footerY)
       .lineTo(550, footerY)
       .strokeColor('#198754')
       .lineWidth(1)
       .stroke();

    // Footer text
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#198754')
       .text('Thank you for choosing Ayur4Life!', 50, footerY + 15, { align: 'center', width: 500 });

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666')
       .text('For any questions, please contact us at ayur4life@gmail.com', 50, footerY + 35, { align: 'center', width: 500 });
    doc.text(`Page ${i + 1} of ${range.count}`, 50, footerY + 55, { align: 'center', width: 500 });
  }
}

module.exports = router; 