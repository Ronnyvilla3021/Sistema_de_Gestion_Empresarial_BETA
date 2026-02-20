require('dotenv').config({ path: '../../.env' });
const bcrypt = require('bcryptjs');
const { sequelize, Role, User, Category, Product, Client } = require('../models');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // ⚠️ Borra y recrea todas las tablas
  console.log('📦 Tablas creadas');

  // Roles
  const [admin] = await Role.findOrCreate({ where: { name: 'admin' } });
  const [supervisor] = await Role.findOrCreate({ where: { name: 'supervisor' } });
  const [vendedor] = await Role.findOrCreate({ where: { name: 'vendedor' } });
  console.log('✅ Roles creados');

  // Usuarios
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  await User.create({ name: 'Admin Sistema', email: 'admin@erp.com', password: hash('admin123'), roleId: admin.id });
  await User.create({ name: 'Supervisor Demo', email: 'supervisor@erp.com', password: hash('super123'), roleId: supervisor.id });
  await User.create({ name: 'Vendedor Demo', email: 'vendedor@erp.com', password: hash('vend123'), roleId: vendedor.id });
  console.log('✅ Usuarios creados');

  // Categorías
  const cats = await Category.bulkCreate([
    { name: 'Electrónica', description: 'Dispositivos electrónicos' },
    { name: 'Computación', description: 'Equipos de cómputo' },
    { name: 'Accesorios', description: 'Accesorios varios' },
    { name: 'Audio', description: 'Equipos de sonido' },
    { name: 'Móviles', description: 'Smartphones y tablets' }
  ]);
  console.log('✅ Categorías creadas');

  // Productos
  await Product.bulkCreate([
    { name: 'Laptop Dell Inspiron 15', sku: 'LAP-001', buyPrice: 650, sellPrice: 899, stock: 12, minStock: 3, categoryId: cats[1].id },
    { name: 'iPhone 15 128GB', sku: 'IPH-001', buyPrice: 750, sellPrice: 999, stock: 8, minStock: 5, categoryId: cats[4].id },
    { name: 'Monitor LG 27" 4K', sku: 'MON-001', buyPrice: 280, sellPrice: 420, stock: 6, minStock: 2, categoryId: cats[0].id },
    { name: 'Teclado Mecánico RGB', sku: 'TEC-001', buyPrice: 45, sellPrice: 89, stock: 25, minStock: 10, categoryId: cats[2].id },
    { name: 'Mouse Logitech MX', sku: 'MOU-001', buyPrice: 55, sellPrice: 95, stock: 30, minStock: 10, categoryId: cats[2].id },
    { name: 'Audífonos Sony WH-1000XM5', sku: 'AUD-001', buyPrice: 220, sellPrice: 349, stock: 15, minStock: 5, categoryId: cats[3].id },
    { name: 'Tablet iPad Air', sku: 'TAB-001', buyPrice: 480, sellPrice: 699, stock: 4, minStock: 3, categoryId: cats[4].id },
    { name: 'SSD Samsung 1TB', sku: 'SSD-001', buyPrice: 70, sellPrice: 120, stock: 40, minStock: 15, categoryId: cats[1].id },
    { name: 'Webcam Logitech C920', sku: 'CAM-001', buyPrice: 60, sellPrice: 110, stock: 2, minStock: 5, categoryId: cats[0].id }, // bajo stock
    { name: 'Hub USB-C 7 puertos', sku: 'HUB-001', buyPrice: 25, sellPrice: 49, stock: 1, minStock: 8, categoryId: cats[2].id }  // bajo stock
  ]);
  console.log('✅ Productos creados');

  // Clientes
  await Client.bulkCreate([
    { name: 'Carlos Ramírez', email: 'carlos@empresa.com', phone: '555-0101', address: 'Av. Principal 123' },
    { name: 'María González', email: 'maria@corp.mx', phone: '555-0102', address: 'Calle 5 de Mayo 456' },
    { name: 'Tech Solutions S.A.', email: 'compras@techsol.com', phone: '555-0103', address: 'Parque Industrial 789' },
    { name: 'Juan Pérez', email: 'juan.perez@gmail.com', phone: '555-0104', address: 'Col. Centro 321' },
    { name: 'Innovatech Corp', email: 'admin@innovatech.com', phone: '555-0105', address: 'Torre Norte Piso 8' }
  ]);
  console.log('✅ Clientes creados');

  console.log('\n🎉 Seed completado!');
  console.log('─────────────────────────────────');
  console.log('👤 Admin:      admin@erp.com / admin123');
  console.log('👤 Supervisor: supervisor@erp.com / super123');
  console.log('👤 Vendedor:   vendedor@erp.com / vend123');
  console.log('─────────────────────────────────\n');
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });