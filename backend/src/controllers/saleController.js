const { Sale, SaleDetail, Product, Client, User, ActivityLog, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { from, to, clientId, userId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) { const end = new Date(to); end.setHours(23,59,59); where.createdAt[Op.lte] = end; }
    }
    if (clientId) where.clientId = clientId;
    if (userId) where.userId = userId;

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: Client, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'name'] },
        { model: SaleDetail, as: 'details', include: [{ model: Product, attributes: ['id', 'name'] }] }
      ],
      limit: +limit, offset: (+page - 1) * +limit, order: [['createdAt', 'DESC']]
    });
    res.json({ total: count, page: +page, pages: Math.ceil(count / limit), data: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clientId, items, notes } = req.body;
    // items: [{ productId, quantity }]
    if (!items || !items.length)
      return res.status(400).json({ message: 'La venta debe tener al menos un producto' });

    let total = 0;
    const detailsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: true });
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);

      const subtotal = product.sellPrice * item.quantity;
      total += subtotal;
      detailsData.push({ productId: product.id, quantity: item.quantity, unitPrice: product.sellPrice, subtotal });
      await product.decrement('stock', { by: item.quantity, transaction: t });
    }

    const sale = await Sale.create({ clientId, userId: req.user.id, total, notes }, { transaction: t });
    for (const d of detailsData) await SaleDetail.create({ ...d, saleId: sale.id }, { transaction: t });
    await ActivityLog.create({ userId: req.user.id, action: 'CREATE', entity: 'Sale', entityId: sale.id, details: `Venta por $${total}` }, { transaction: t });

    await t.commit();
    const fullSale = await Sale.findByPk(sale.id, {
      include: [Client, User, { model: SaleDetail, as: 'details', include: [Product] }]
    });
    res.status(201).json(fullSale);
  } catch (e) {
    await t.rollback();
    res.status(400).json({ message: e.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [Client, User, { model: SaleDetail, as: 'details', include: [Product] }]
    });
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(sale);
  } catch (e) { res.status(500).json({ message: e.message }); }
};