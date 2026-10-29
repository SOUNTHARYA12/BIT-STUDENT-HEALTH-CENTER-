import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { initializeDatabase } from './src/server/db.ts';
import { apiRouter } from './src/server/routes.ts';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  // Initialize SQLite database schema and seed data
  try {
    initializeDatabase();
    console.log('BIT Health Center database initialized and seeded successfully.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  app.use(express.json());
  app.use(cookieParser());

  // Mount API router
  app.use('/api', apiRouter);

  // In development or when running under tsx, attach Vite middleware
  if (process.env.NODE_ENV === 'production' && !process.env.VITE_DEV_MODE) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`BIT Health Center Portal running on port ${port}`);
  });
}

startServer();
