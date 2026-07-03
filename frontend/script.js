const API_BASE_URL = 'http://54.211.188.243:222';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const remainingCount = document.getElementById('remaining-count');
const statusMessage = document.getElementById('status-message');
const filterButtons = document.querySelectorAll('.filter-button');

let todos = [];
let activeFilter = 'all';

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char];
  });
}

function visibleTodos() {
  if (activeFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }

  if (activeFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

function renderTodos() {
  const openTodos = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = openTodos;

  const items = visibleTodos();

  if (items.length === 0) {
    todoList.innerHTML = '<li class="empty-state">No tasks in this view.</li>';
    return;
  }

  todoList.innerHTML = items
    .map(
      (todo) => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <label class="check-wrap">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} />
            <span>${escapeHtml(todo.title)}</span>
          </label>
          <div class="item-actions">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
          </div>
        </li>
      `
    )
    .join('');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadTodos() {
  try {
    todos = await request('/api/todos');
    setStatus('');
    renderTodos();
  } catch (error) {
    setStatus('Unable to load todos. Is the backend running?', true);
  }
}

todoForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = todoInput.value.trim();
  if (!title) return;

  try {
    const todo = await request('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    todos = [todo, ...todos];
    todoForm.reset();
    setStatus('Task added.');
    renderTodos();
  } catch (error) {
    setStatus(error.message, true);
  }
});

todoList.addEventListener('change', async (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox) return;

  const item = checkbox.closest('.todo-item');
  const id = Number(item.dataset.id);
  const currentTodo = todos.find((todo) => todo.id === id);

  try {
    const updatedTodo = await request(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: checkbox.checked })
    });
    todos = todos.map((todo) => (todo.id === id ? updatedTodo : todo));
    setStatus(currentTodo?.completed ? 'Task reopened.' : 'Task completed.');
    renderTodos();
  } catch (error) {
    setStatus(error.message, true);
    checkbox.checked = !checkbox.checked;
  }
});

todoList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const item = button.closest('.todo-item');
  const id = Number(item.dataset.id);
  const todo = todos.find((entry) => entry.id === id);

  if (!todo) return;

  if (button.dataset.action === 'delete') {
    try {
      await request(`/api/todos/${id}`, { method: 'DELETE' });
      todos = todos.filter((entry) => entry.id !== id);
      setStatus('Task deleted.');
      renderTodos();
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  if (button.dataset.action === 'edit') {
    const title = window.prompt('Edit task', todo.title);
    if (title === null) return;

    try {
      const updatedTodo = await request(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title })
      });
      todos = todos.map((entry) => (entry.id === id ? updatedTodo : entry));
      setStatus('Task updated.');
      renderTodos();
    } catch (error) {
      setStatus(error.message, true);
    }
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle('active', item === button));
    renderTodos();
  });
});

loadTodos();
