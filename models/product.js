const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  description: String,
  amount: Number,
  quantity: Number,
  category: String,
  ownerEmail: String // to track who listed it
});

module.exports = mongoose.model('Product', productSchema);

