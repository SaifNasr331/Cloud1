const issueService = require('../services/issueService');

const priorities = new Set(['Low', 'Medium', 'High']);
const statuses = new Set(['Open', 'Resolved']);

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function checkText(value, label, min, max) {
  if (typeof value !== 'string') {
    return `${label} is required.`;
  }
  const length = value.trim().length;
  if (length < min || length > max) {
    return `${label} must contain between ${min} and ${max} characters.`;
  }
  return null;
}

function validateNewIssue(title, description, priority) {
  const textProblem = checkText(title, 'Title', 3, 100) ||
                      checkText(description, 'Description', 5, 500);
  if (textProblem) return textProblem;
  
  if (!priorities.has(priority)) {
    return 'Priority must be Low, Medium or High.';
  }
  return null;
}

async function listIssues(req, res, next) {
  try {
    const issues = await issueService.readIssues();
    res.status(200).json(issues);
  } catch (error) {
    next(error);
  }
}

async function createIssue(req, res, next) {
  try {
    if (!req.is('application/json')) {
      return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
    }
    const { title, description, priority } = req.body;
    const problem = validateNewIssue(title, description, priority);
    if (problem) {
      return sendError(res, 400, 'VALIDATION_ERROR', problem);
    }
    const issue = await issueService.createIssue({ title, description, priority });
    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
}

async function updateIssueStatus(req, res, next) {
  try {
    if (!req.is('application/json')) {
      return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
    }
    const { status } = req.body;
    if (!statuses.has(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status must be Open or Resolved.');
    }
    const issueId = req.params.id;
    const issue = await issueService.updateIssueStatus(issueId, status);
    if (!issue) {
      return sendError(res, 404, 'ISSUE_NOT_FOUND', 'Issue not found.');
    }
    res.status(200).json(issue);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listIssues,
  createIssue,
  updateIssueStatus
};