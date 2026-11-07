const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (error) {
    throw new Error('Cannot reach the TODO API. Please try again.');
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    throw new Error('The TODO API returned an invalid response.');
  }
  if (!response.ok) {
    const message = body && typeof body.error === 'string'
      ? body.error
      : 'The TODO request failed. Please try again.';
    throw new Error(message);
  }
  return body;
}

export async function getTodos() {
  const body = await request('/todos');
  if (!Array.isArray(body.todos)) {
    throw new Error('The TODO API returned an invalid list.');
  }
  return body.todos;
}

export async function createTodo(description) {
  const body = await request('/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  return body.todo;
}
