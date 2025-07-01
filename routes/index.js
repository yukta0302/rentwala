const express = require('express');
const router = express.Router();

// POST: handle website rating form
router.post('/submit-rating', (req, res) => {
  const rating = req.body.rating;

  console.log('User submitted rating:', rating);

  // TODO: Save rating to your DB (MongoDB, MySQL, file, etc.)
  // Example: await Rating.create({ value: rating });

  // Redirect to a thank you page or back to home
  res.redirect('/thank-you');
});

module.exports = router;
