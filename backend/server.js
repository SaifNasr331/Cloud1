require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const issueRoutes = require('./routes/issues');

const app = express();
const PORT = Number(process.env.PORT || 3000);
let serverInstance = null;

app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Serve the existing frontend when the backend is started with `npm run dev`.
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Cloud Issue Tracker API',
    endpoints: {
      issues: '/api/issues',
    },
  });
});
app.use('/api/issues', issueRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' },
    });
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } });
});

function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    serverInstance = app.listen(port, () => resolve(serverInstance));
    serverInstance.on('error', reject);
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (!serverInstance) return resolve();
    const instance = serverInstance;
    serverInstance = null;
    instance.close((error) => (error ? reject(error) : resolve()));
  });
}

if (require.main === module) {
  startServer().then((server) => {
    console.log(`Issue API listening on http://localhost:${server.address().port}`);
  }).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { app, startServer, stopServer };
