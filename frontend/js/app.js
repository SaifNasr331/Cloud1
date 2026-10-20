const API_URL = window.location.port === '8080'
  ? 'http://localhost:3000/api/issues'
  : '/api/issues';
const issueForm = document.querySelector('#issue-form');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const priorityInput = document.querySelector('#priority');
const issuesList = document.querySelector('#issues-list');
const issueCount = document.querySelector('#issue-count');
const formMessage = document.querySelector('#form-message');

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
}

function renderIssues(issues) {
  issueCount.textContent = issues.length;
  issuesList.replaceChildren();
  issues.forEach((issue) => {
    const card = document.createElement('article');
    card.className = 'issue-card';
    card.innerHTML = '<h3></h3><p class="description"></p><p class="meta"></p>';
    card.querySelector('h3').textContent = issue.title;
    card.querySelector('.description').textContent = issue.description;
    card.querySelector('.meta').textContent = `Priority: ${issue.priority} | Status: ${issue.status}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = issue.status === 'Open' ? 'Mark Resolved' : 'Reopen';
    button.addEventListener('click', () => updateStatus(issue));
    card.append(button);
    issuesList.append(card);
  });
}

async function loadIssues() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Unable to load issues.');
  renderIssues(await response.json());
}

async function updateStatus(issue) {
  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(issue.id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: issue.status === 'Open' ? 'Resolved' : 'Open' }),
    });
    if (!response.ok) throw new Error('Unable to update issue status.');
    await loadIssues();
  } catch (error) {
    showMessage(error.message, true);
  }
}

issueForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleInput.value.trim(), description: descriptionInput.value.trim(), priority: priorityInput.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || result.error || 'Unable to create issue.');
    issueForm.reset();
    priorityInput.value = 'Medium';
    showMessage('Issue created.');
    await loadIssues();
  } catch (error) {
    showMessage(error.message, true);
  }
});

loadIssues().catch((error) => showMessage(error.message, true));
