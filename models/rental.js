// ✅ models/rental.js
const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  userEmail: String,
  productId: mongoose.Schema.Types.ObjectId,
  productName: String,
  days: Number,
  paymentMethod: String,
  shippingAddress: String,
  totalAmount: Number,
  rentedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rental', rentalSchema);
