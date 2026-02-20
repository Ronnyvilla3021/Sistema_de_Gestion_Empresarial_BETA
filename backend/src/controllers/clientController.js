const { Client, Sale, User } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { search, active, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } }
    ];
    if (active !== undefined) where.active = active === 'true';

    const { count, rows } = await Client.findAndCountAll({
      where, limit: +limit, offset: (+page - 1) * +limit, order: [['name', 'ASC']]
    });
    res.json({ total: count, page: +page, pages: Math.ceil(count / limit), data: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{ model: Sale, include: [User], order: [['createdAt', 'DESC']], limit: 10 }]
    });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    await client.update(req.body);
    res.json(client);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    await client.update({ active: false });
    res.json({ message: 'Cliente desactivado' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};