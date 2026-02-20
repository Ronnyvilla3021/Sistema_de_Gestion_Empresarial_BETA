const { Product, Category, ActivityLog } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { search, categoryId, lowStock, page = 1, limit = 20 } = req.query;
    const where = { active: true };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (categoryId) where.categoryId = categoryId;
    if (lowStock === 'true') where.stock = { [Op.lte]: sequelize.col('minStock') };

    const offset = (page - 1) * limit;
    const { count, rows } = await Product.findAndCountAll({
      where, include: [Category], limit: +limit, offset, order: [['name', 'ASC']]
    });
    res.json({ total: count, page: +page, pages: Math.ceil(count / limit), data: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: [Category] });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description, sku, buyPrice, sellPrice, stock, minStock, categoryId } = req.body;
    if (!name || buyPrice == null || sellPrice == null)
      return res.status(400).json({ message: 'Nombre, precio de compra y venta son requeridos' });
    if (+buyPrice < 0 || +sellPrice < 0)
      return res.status(400).json({ message: 'Los precios no pueden ser negativos' });
    if (+stock < 0)
      return res.status(400).json({ message: 'El stock no puede ser negativo' });

    const product = await Product.create({ name, description, sku, buyPrice, sellPrice, stock: stock || 0, minStock: minStock || 5, categoryId });
    await ActivityLog.create({ userId: req.user.id, action: 'CREATE', entity: 'Product', entityId: product.id, details: `Creó producto: ${name}` });
    res.status(201).json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    const { buyPrice, sellPrice, stock } = req.body;
    if (buyPrice != null && +buyPrice < 0)
      return res.status(400).json({ message: 'Precio de compra inválido' });
    if (sellPrice != null && +sellPrice < 0)
      return res.status(400).json({ message: 'Precio de venta inválido' });
    if (stock != null && +stock < 0)
      return res.status(400).json({ message: 'Stock no puede ser negativo' });

    await product.update(req.body);
    await ActivityLog.create({ userId: req.user.id, action: 'UPDATE', entity: 'Product', entityId: product.id, details: `Actualizó producto: ${product.name}` });
    res.json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    await product.update({ active: false });
    await ActivityLog.create({ userId: req.user.id, action: 'DELETE', entity: 'Product', entityId: product.id, details: `Eliminó producto: ${product.name}` });
    res.json({ message: 'Producto eliminado' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getLowStock = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const products = await Product.findAll({
      where: { active: true, stock: { [Op.lte]: 10 } },
      include: [Category],
      order: [['stock', 'ASC']],
      limit: 10
    });
    res.json(products);
  } catch (e) { res.status(500).json({ message: e.message }); }
};