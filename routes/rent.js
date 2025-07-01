const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.post('/:id', async (req, res) => {
  if (!req.session.user) return res.send('❌ Please login.');
  const product = await Product.findById(req.params.id);
  if (!product || product.quantity <= 0) return res.send('❌ Not available.');
  product.quantity -= 1;
  await product.save();
  res.render('rent-success', {
    title: 'Rental Successful',
    product,
    user: req.session.user
  });
});

module.exports = router;
