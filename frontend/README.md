# 📊 Mini ERP – Sistema de Gestión Empresarial

Sistema full-stack para gestión de inventario, ventas y clientes.

## 🚀 Stack Tecnológico

**Frontend:** React 18 + Vite + Tailwind CSS + Recharts  
**Backend:** Node.js + Express + Sequelize ORM  
**Base de datos:** PostgreSQL  
**Auth:** JWT (JSON Web Tokens)  
**Deploy:** Vercel (frontend) + Railway (backend + DB)

---

## 📦 Módulos

- **Dashboard** – KPIs financieros, gráficas de ingresos mensuales, top productos
- **Productos** – CRUD con control de stock, precios, categorías
- **Clientes** – CRUD con búsqueda, historial, estado activo/inactivo
- **Ventas** – Registro de ventas con carrito, actualización automática de stock
- **Reportes** – Reporte de ventas por fechas e inventario, exportar CSV

---

## 👥 Usuarios Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@erp.com | admin123 |
| Supervisor | supervisor@erp.com | super123 |
| Vendedor | vendedor@erp.com | vend123 |

---

## ⚡ Instalación local

### 1. Clona el repositorio
```bash
git clone https://github.com/TU_USUARIO/mini-erp.git
cd mini-erp
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tu DATABASE_URL y JWT_SECRET
npm run seed    # Carga datos de prueba
npm run dev     # Inicia en puerto 4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edita VITE_API_URL=http://localhost:4000/api (en desarrollo)
npm run dev     # Inicia en puerto 5173
```

---

## 🌐 Deploy gratuito

### Backend → Railway
1. Crea cuenta en railway.app
2. New Project → Deploy from GitHub
3. Selecciona la carpeta `backend`
4. Agrega PostgreSQL como plugin
5. Configura variables de entorno (DATABASE_URL, JWT_SECRET, FRONTEND_URL)
6. Railway te da la URL pública

### Frontend → Vercel
1. Crea cuenta en vercel.com
2. Import Git Repository
3. Selecciona la carpeta `frontend`
4. Agrega variable: VITE_API_URL = URL del backend de Railway + /api
5. Deploy

---

## 🗂️ Estructura del proyecto

```
mini-erp/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── middleware/     # Auth JWT
│   │   ├── models/         # Sequelize ORM
│   │   ├── routes/         # Endpoints API
│   │   ├── seeders/        # Datos de prueba
│   │   └── index.js        # Entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/        # Estado global (Auth)
    │   ├── lib/            # API client (axios)
    │   ├── pages/          # Dashboard, Products, etc.
    │   ├── components/     # Layout, Sidebar
    │   └── main.jsx
    └── package.json
```

---

## 🔐 Seguridad implementada

- JWT con expiración de 8 horas
- Autorización por roles (admin, supervisor, vendedor)
- Validación de stock negativo y precios inválidos
- Transacciones SQL para ventas (evita stock inconsistente)
- CORS configurado correctamente

---

## 📊 Diagrama de base de datos

```
Roles ──< Users >──< Sales >──< SaleDetails >──< Products >──< Categories
                       │
                    Clients
                       │
                ActivityLogs
```