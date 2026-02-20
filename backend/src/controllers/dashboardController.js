const { Sale, SaleDetail, Product, Client, Category, User, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ventas totales del mes
    const monthSales = await Sale.sum('total', {
      where: { createdAt: { [Op.gte]: startMonth }, status: 'completed' }
    }) || 0;

    // Número de ventas del mes
    const monthSalesCount = await Sale.count({
      where: { createdAt: { [Op.gte]: startMonth } }
    });

    // Total clientes activos
    const activeClients = await Client.count({ where: { active: true } });

    // Productos con bajo stock (sin literal)
    const allProducts = await Product.findAll({ where: { active: true }, attributes: ['stock', 'minStock'] });
    const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock).length;

    // Productos más vendidos
    const topProducts = await sequelize.query(`
      SELECT 
        sd."productId",
        p.name as "productName",
        SUM(sd.quantity) as "totalSold",
        SUM(sd.subtotal) as "revenue"
      FROM "SaleDetails" sd
      JOIN "Products" p ON p.id = sd."productId"
      GROUP BY sd."productId", p.name
      ORDER BY "totalSold" DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    // Ingresos mensuales (últimos 6 meses)
    const monthlyRevenue = await sequelize.query(`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(total) as revenue,
        COUNT(id) as sales
      FROM "Sales"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        AND status = 'completed'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Ventas por categoría
    const salesByCategory = await sequelize.query(`
      SELECT 
        c.name as "categoryName",
        SUM(sd.subtotal) as revenue
      FROM "SaleDetails" sd
      JOIN "Products" p ON p.id = sd."productId"
      JOIN "Categories" c ON c.id = p."categoryId"
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({
      kpis: { monthSales, monthSalesCount, activeClients, lowStockProducts },
      topProducts,
      monthlyRevenue,
      salesByCategory
    });
  } catch (e) {
    console.error('Dashboard error:', e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { active: true },
      include: [Category],
      order: [['stock', 'ASC']]
    });
    const value = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);
    res.json({ products, totalValue: value });
  } catch (e) { res.status(500).json({ message: e.message }); }
};