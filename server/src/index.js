import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import menuRoutes from './modules/menus/routes.js';
import userRoutes from './modules/users/routes.js';
import roleRoutes from './modules/roles/routes.js';
import settingsRoutes from "./modules/settings/routes.js";
import tallyRoutes from "./modules/tally/routes.js";
import productRoutes from "./modules/products/routes.js";
import orderRoutes from "./modules/orders/routes.js";
import integrationRoutes from "./modules/integration/routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', rateLimit({ windowMs: 60_000, max: 30 }));
app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use("/settings", settingsRoutes);
app.use("/tally", tallyRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/integration", integrationRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('/health', (_, res) => res.json({ ok: true }));

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
// app.get('/:path*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
// });

app.use((req, res, next) => {
  // If the request is for an API (starts with your defined routes), skip this
  const apiRoutes = ['/auth', '/menus', '/users', '/roles', '/settings', '/tally', '/products', '/orders', '/integration', '/health'];
  if (apiRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }
  // Otherwise, send the index.html
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(env.PORT, () => console.log(`Server on ${env.PORT}`));
