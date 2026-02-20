const { Category } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const cats = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(cats);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const cat = await Category.create({ name, description });
    res.status(201).json(cat);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Categoría no encontrada' });
    await cat.update(req.body);
    res.json(cat);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Categoría no encontrada' });
    await cat.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};