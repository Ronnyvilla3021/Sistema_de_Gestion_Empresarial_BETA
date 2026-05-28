require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;



// Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://sistemagestionempresarial.netlify.app'
  ],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// API Routes
app.use('/api', routes);

// Error handler central
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

// Iniciar servidor
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada');
    await sequelize.sync({ alter: true }); // Crea/actualiza tablas automáticamente
    console.log('✅ Tablas sincronizadas');
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
  } catch (err) {
    console.error('❌ Error al iniciar:', err.message);
    process.exit(1);
  }
};

start();