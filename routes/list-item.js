const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/product');

const router = express.Router();

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ✅ GET: Show form
router.get('/', (req, res) => {
  res.render('list-item', {
    title: 'List Your Item - RentWala',
    user: req.session.user
  });
});

// ✅ POST: Handle form submission
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.session.user) return res.send('❌ Please log in first.');

  const { name, description, amount, quantity, category } = req.body;
  const imageUrl = req.file ? '/uploads/' + req.file.filename : null;

  try {
    await Product.create({
      name,
      description,
      amount,
      quantity,
      category,
      imageUrl,
      ownerEmail: req.session.user.email
    });

    const paths = {
      'Home Appliances': 'home-appliances',
      'Electronics': 'electronics',
      'Furniture': 'furniture',
      'Event Supplies': 'event-supplies',
      'Mobile Devices': 'mobile-devices',
      'Office Equipment': 'office-equipment',
      'Automobiles': 'automobiles',
      'Tools & Equipment': 'tools-equipment'
    };

    const categoryPath = paths[category];
    if (!categoryPath) return res.send('✅ Item listed, but category unknown!');
    
    res.redirect(`/categories/${categoryPath}`);
  } catch (err) {
    console.error(err);
    res.send('❌ Failed to list item.');
  }
});

// ✅ Export ONCE at the end
module.exports = router;
