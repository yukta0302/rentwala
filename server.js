const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const User = require('./models/user');
const Product = require('./models/product');
const Rental = require('./models/rental');
const listItemRoutes = require('./routes/list-item');



const app = express();
const PORT = 3000;

// ---------------------
// ✅ View engine & Static
// ---------------------
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ---------------------
// ✅ Sessions
// ---------------------
app.use(session({
  secret: 'mysecretkey123',
  resave: false,
  saveUninitialized: false
}));

// ---------------------
// ✅ MongoDB
// ---------------------
mongoose.connect('mongodb://127.0.0.1:27017/rentwala')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---------------------
// ✅ Basic pages
// ---------------------
app.get('/', (req, res) => {
  res.render('index', {
    title: 'RentWala - Home',
    user: req.session.user,
    cart: req.session.cart || []
  });
});

app.get('/categories', (req, res) => {
  res.render('categories', { title: 'Categories', user: req.session.user });
});

app.get('/featured', (req, res) => {
  res.render('featured', { title: 'Featured', user: req.session.user });
});

app.get('/howitworks', (req, res) => {
  res.render('howitworks', { title: 'How It Works', user: req.session.user });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact', user: req.session.user });
});

// ---------------------
// ✅ Auth routes
// ---------------------
app.get('/register', (req, res) => {
  res.render('register', { title: 'Register', user: req.session.user });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.send('User already exists.');

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  req.session.user = { email, name };
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', user: req.session.user });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send('Invalid login.');
  }

  req.session.user = { email: user.email, name: user.name }; // ✅ Fixed
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});


// ---------------------
// ✅ Category pages with dynamic product loading
// ---------------------
const categories = [
  { path: 'home-appliances', name: 'Home Appliances' },
  { path: 'electronics', name: 'Electronics' },
  { path: 'furniture', name: 'Furniture' },
  { path: 'event-supplies', name: 'Event Supplies' },
  { path: 'mobile-devices', name: 'Mobile Devices' },
  { path: 'office-equipment', name: 'Office Equipment' },
  { path: 'automobiles', name: 'Automobiles' },
  { path: 'tools-equipment', name: 'Tools & Equipment' }
];

categories.forEach(cat => {
  app.get(`/categories/${cat.path}`, async (req, res) => {
    const products = await Product.find({ category: cat.name });
    res.render('categories/products', {
      title: `${cat.name} - RentWala`,
      categoryName: cat.name,
      products,
      user: req.session.user
    });
  });
});

// ---------------------
// ✅ List Item Route
// ---------------------
app.use('/list-item', listItemRoutes);

// ---------------------
// ✅ Product detail
// ---------------------
app.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.send('❌ Not found');
  res.render('product-detail', {
    title: `Product - ${product.name}`,
    product,
    user: req.session.user
  });
});



// ---------------------
// ✅ Cart system
// ---------------------
app.post('/cart/add', (req, res) => {
  if (!req.session.user) return res.send('❌ Please login.');

  const { productId, days, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];

  req.session.cart.push({
    productId,
    days: parseInt(days),
    quantity: parseInt(quantity)
  });

  res.redirect('/cart');
});

app.get('/cart', async (req, res) => {
  if (!req.session.user) return res.send('❌ Please login.');
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.render('cart', {
      items: [],
      user: req.session.user,
      title: 'Your Cart'
    });
  }

  const items = [];
  for (const item of req.session.cart) {
    const product = await Product.findById(item.productId);
    if (product) {
      items.push({
        product,
        days: item.days,
        quantity: item.quantity
      });
    }
  }

  res.render('cart', {
    items,
    user: req.session.user,
    title: 'Your Cart'
  });
});



// ---------------------
// ✅ Checkout
// ---------------------
app.get('/checkout', async (req, res) => {
  if (!req.session.user) return res.send('❌ Please login.');
  if (!req.session.cart || req.session.cart.length === 0) return res.send('❌ Cart is empty.');

  const items = [];
  let grandTotal = 0;

  for (const item of req.session.cart) {
    const product = await Product.findById(item.productId);
    if (product) {
      const subtotal = product.amount * item.days * item.quantity;
      grandTotal += subtotal;
      items.push({
        product,
        days: item.days,
        quantity: item.quantity
      });
    }
  }

  res.render('checkout', {
    title: 'Checkout',
    cart: items,
    grandTotal,
    user: req.session.user
  });
});

app.post('/checkout', async (req, res) => {
  if (!req.session.user) return res.send('❌ Please login.');
  const { shippingAddress, paymentMethod, latitude, longitude } = req.body;

  const cart = req.session.cart || [];

  for (const item of cart) {
    const product = await Product.findById(item.productId);
    if (product) {
      await Rental.create({
        userEmail: req.session.user.email,
        productId: product._id,
        productName: product.name,
        days: item.days,
        paymentMethod,
        shippingAddress,
        totalAmount: item.days * item.quantity * product.amount
      });
      product.quantity -= item.quantity;
      await product.save();
    }
  }

  req.session.cart = [];
  res.render('rent-success', {
  title: 'Order Placed - RentWala',
  user: req.session.user
});

});

app.get('/search', async (req, res) => {
  const query = req.query.q;

  try {
    const products = await Product.find({
      name: { $regex: query, $options: 'i' } // case-insensitive search
    });

    res.render('search-results', {
      title: `Search Results for "${query}"`,
      products,
      user: req.session.user,
      query
    });
  } catch (err) {
    console.error(err);
    res.send('❌ Error searching products.');
  }
});


// ---------------------
// ✅ My Rentals Page
// ---------------------
app.get('/my-rentals', async (req, res) => {
  if (!req.session.user) return res.send('❌ Please login.');
  const rentals = await Rental.find({ userEmail: req.session.user.email });
  res.render('my-rentals', { title: 'My Rentals', rentals, user: req.session.user });
});

// ---------------------
// ✅ Sessions
// ---------------------
app.use(session({
  secret: 'mysecretkey123',
  resave: false,
  saveUninitialized: false
}));
// ---------------------
// ✅ Start Server
// ---------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
