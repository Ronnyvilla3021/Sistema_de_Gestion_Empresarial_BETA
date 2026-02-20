const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const productCtrl = require('../controllers/productController');
const clientCtrl = require('../controllers/clientController');
const saleCtrl = require('../controllers/saleController');
const dashCtrl = require('../controllers/dashboardController');
const catCtrl = require('../controllers/categoryController');

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);

// Dashboard
router.get('/dashboard', authenticate, dashCtrl.getDashboard);
router.get('/reports/inventory', authenticate, dashCtrl.getInventoryReport);

// Categories
router.get('/categories', authenticate, catCtrl.getAll);
router.post('/categories', authenticate, authorize('admin'), catCtrl.create);
router.put('/categories/:id', authenticate, authorize('admin'), catCtrl.update);
router.delete('/categories/:id', authenticate, authorize('admin'), catCtrl.remove);

// Products
router.get('/products', authenticate, productCtrl.getAll);
router.get('/products/low-stock', authenticate, productCtrl.getLowStock);
router.get('/products/:id', authenticate, productCtrl.getOne);
router.post('/products', authenticate, authorize('admin', 'supervisor'), productCtrl.create);
router.put('/products/:id', authenticate, authorize('admin', 'supervisor'), productCtrl.update);
router.delete('/products/:id', authenticate, authorize('admin'), productCtrl.remove);

// Clients
router.get('/clients', authenticate, clientCtrl.getAll);
router.get('/clients/:id', authenticate, clientCtrl.getOne);
router.post('/clients', authenticate, clientCtrl.create);
router.put('/clients/:id', authenticate, clientCtrl.update);
router.delete('/clients/:id', authenticate, authorize('admin', 'supervisor'), clientCtrl.remove);

// Sales
router.get('/sales', authenticate, saleCtrl.getAll);
router.get('/sales/:id', authenticate, saleCtrl.getOne);
router.post('/sales', authenticate, saleCtrl.create);

module.exports = router;