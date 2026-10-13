const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT || 3000);
let serverInstance = null;

const issues = [
  {
    id: 'ISS-101',
    title: 'Unable to access Wi‑Fi',
    description: 'Connection fails in the teaching lab.',
    priority: 'High',
    status: 'Open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ISS-102',
    title: 'Projector not detected',
    description: 'Laptop cannot detect the classroom projector.',
    priority: 'Medium',
    status: 'Open',
    createdAt: new Date().toISOString(),
  },
];

const validPriorities = new Set(['Low', 'Medium', 'High']);
const validStatuses = new Set(['Open', 'Resolved']);

app.use(
  cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json());

function normalizeStatus(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function validateIssueInput(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body must be a JSON object.';
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const priority = typeof payload.priority === 'string' ? payload.priority.trim() : '';

  if (title.length < 3 || title.length > 100) {
    return 'Title must be 3-100 characters.';
  }

  if (description.length < 5 || description.length > 500) {
    return 'Description must be 5-500 characters.';
  }

  if (!validPriorities.has(priority)) {
    return 'Priority must be one of: Low, Medium, High.';
  }

  return null;
}

app.get('/api/issues', (req, res) => {
  res.status(200).json(issues);
});

app.post('/api/issues', (req, res) => {
  const validationError = validateIssueInput(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const nextId = `ISS-${Date.now()}`;
  const newIssue = {
    id: nextId,
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    priority: req.body.priority.trim(),
    status: 'Open',
    createdAt: new Date().toISOString(),
  };

  issues.push(newIssue);
  return res.status(201).json(newIssue);
});

app.patch('/api/issues/:id/status', (req, res) => {
  const issue = issues.find((item) => item.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  const status = normalizeStatus(req.body?.status);
  if (!validStatuses.has(status)) {
    return res.status(400).json({ error: 'Status must be either Open or Resolved.' });
  }

  issue.status = status;
  return res.status(200).json(issue);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    serverInstance = app.listen(port, () => resolve(serverInstance));
    serverInstance.on('error', (error) => reject(error));
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (!serverInstance) {
      return resolve();
    }

    const instance = serverInstance;
    serverInstance = null;

    instance.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

if (require.main === module) {
  startServer(PORT)
    .then((server) => {
      console.log(`Issue API listening on http://localhost:${server.address().port}`);
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

module.exports = {
  app,
  issues,
  startServer,
  stopServer,
};
