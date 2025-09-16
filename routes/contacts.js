const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Submit contact form (public route)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('contacts').add(contactData);

    res.status(201).json({
      message: 'Contact form submitted successfully',
      contactId: docRef.id
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to submit contact form', details: error.message });
  }
});

// Get all contacts (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, status, search, dateFrom, dateTo } = req.query;
    
    let query = db.collection('contacts').orderBy('createdAt', 'desc');
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      query = query.where('createdAt', '>=', fromDate.toISOString());
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.where('createdAt', '<=', toDate.toISOString());
    }
    
    const contactsSnapshot = await query.limit(parseInt(limit)).get();
    
    const contacts = [];
    contactsSnapshot.forEach(doc => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Apply search filter if provided (client-side filtering for simplicity)
    let filteredContacts = contacts;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.email.toLowerCase().includes(searchTerm) ||
        contact.subject.toLowerCase().includes(searchTerm) ||
        contact.message.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(filteredContacts);
    
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts', details: error.message });
  }
});

// Get contact by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const contactDoc = await db.collection('contacts').doc(id).get();

    if (!contactDoc.exists) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      id: contactDoc.id,
      ...contactDoc.data()
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact', details: error.message });
  }
});

// Update contact status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['unread', 'read', 'replied', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const contactRef = db.collection('contacts').doc(id);
    await contactRef.update({
      status: status,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Contact status updated successfully' });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ error: 'Failed to update contact status', details: error.message });
  }
});

// Delete contact (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const contactDoc = await db.collection('contacts').doc(id).get();
    if (!contactDoc.exists) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await db.collection('contacts').doc(id).delete();

    res.json({ message: 'Contact deleted successfully', contactId: id });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact', details: error.message });
  }
});

module.exports = router;
