const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
  ssl: { require: true, rejectUnauthorized: false }
}
});

// ─── MODELOS ────────────────────────────────────────────────────────────────

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true }
}, { timestamps: false });

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { timestamps: false });

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  sku: { type: DataTypes.STRING(50), unique: true },
  buyPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false,
    validate: { min: 0 } },
  sellPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false,
    validate: { min: 0 } },
  stock: { type: DataTypes.INTEGER, defaultValue: 0,
    validate: { min: 0 } },
  minStock: { type: DataTypes.INTEGER, defaultValue: 5 },
  categoryId: { type: DataTypes.INTEGER },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150) },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clientId: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('completed', 'cancelled'), defaultValue: 'completed' },
  notes: { type: DataTypes.TEXT }
});

const SaleDetail = sequelize.define('SaleDetail', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  saleId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { timestamps: false });

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING(100) },
  entity: { type: DataTypes.STRING(50) },
  entityId: { type: DataTypes.INTEGER },
  details: { type: DataTypes.TEXT }
}, { updatedAt: false });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña requeridos' });

    const user = await User.findOne({ where: { email }, include: [Role] });
    console.log('User found:', user ? user.email : 'NOT FOUND');
    if (!user)
      return res.status(401).json({ message: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', valid);
    if (!valid)
      return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.Role.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.Role.name }
    });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ message: 'Error del servidor', error: e.message });
  }
};

// ─── RELACIONES ──────────────────────────────────────────────────────────────

Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Client.hasMany(Sale, { foreignKey: 'clientId' });
Sale.belongsTo(Client, { foreignKey: 'clientId' });

User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'userId' });

Sale.hasMany(SaleDetail, { foreignKey: 'saleId', as: 'details' });
SaleDetail.belongsTo(Sale, { foreignKey: 'saleId' });

Product.hasMany(SaleDetail, { foreignKey: 'productId' });
SaleDetail.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(ActivityLog, { foreignKey: 'userId' });

module.exports = { sequelize, Role, User, Category, Product, Client, Sale, SaleDetail, ActivityLog };