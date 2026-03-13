// ---- DOM References ----
const input    = document.getElementById('todo-input');
const addBtn   = document.getElementById('add-btn');
const list     = document.getElementById('todo-list');
const pendingCount   = document.getElementById('pending-count');
const statTotal      = document.getElementById('stat-total');
const statPending    = document.getElementById('stat-pending');
const statDone       = document.getElementById('stat-done');
const statProgress   = document.getElementById('stat-progress');

// ---- Fetch helpers ----

async function loadTodos() {
  const res = await fetch('/api/todos');
  const { data } = await res.json();
  renderTodos(data);
}

async function addTodo(text) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error);
    return;
  }
  loadTodos();
}

async function toggleTodo(id) {
  await fetch(`/api/todos/${id}`, { method: 'PUT' });
  loadTodos();
}

async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  loadTodos();
}

// ---- Render ----

function updateStats(todos) {
  const total   = todos.length;
  const done    = todos.filter((t) => t.done).length;
  const pending = total - done;
  const pct     = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent    = total;
  statPending.textContent  = pending;
  statDone.textContent     = done;
  statProgress.textContent = pct + '%';
  pendingCount.textContent = pending + ' pending';
}

function renderTodos(todos) {
  list.innerHTML = '';
  updateStats(todos);

  if (todos.length === 0) {
    list.innerHTML = `
      <li class="flex flex-col items-center justify-center py-14 text-gray-400">
        <svg class="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p class="text-sm">ยังไม่มีรายการ ลองเพิ่มดูสิ!</p>
      </li>`;
    return;
  }

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group';

    // ---- Row number ----
    const num = document.createElement('span');
    num.className = 'text-xs text-gray-300 font-medium w-5 text-right shrink-0';
    num.textContent = index + 1;

    // ---- Checkbox ----
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.className = 'w-4 h-4 accent-[#465FFF] cursor-pointer shrink-0';
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // ---- Text + timestamp ----
    const textWrap = document.createElement('div');
    textWrap.className = 'flex-1 min-w-0';

    const span = document.createElement('span');
    span.className = 'todo-text block text-sm font-medium text-gray-800 truncate' + (todo.done ? ' done' : '');
    span.textContent = todo.text;

    const time = document.createElement('span');
    time.className = 'text-xs text-gray-400';
    time.textContent = new Date(todo.createdAt).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    textWrap.appendChild(span);
    textWrap.appendChild(time);

    // ---- Status badge ----
    const badge = document.createElement('span');
    if (todo.done) {
      badge.className = 'text-xs font-medium bg-green-50 text-green-600 px-2.5 py-1 rounded-full shrink-0';
      badge.textContent = 'Done';
    } else {
      badge.className = 'text-xs font-medium bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full shrink-0';
      badge.textContent = 'Pending';
    }

    // ---- Delete button ----
    const delBtn = document.createElement('button');
    delBtn.className =
      'opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0';
    delBtn.title = 'ลบรายการ';
    delBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>`;
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(num);
    li.appendChild(checkbox);
    li.appendChild(textWrap);
    li.appendChild(badge);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// ---- Event Listeners ----

addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addTodo(text);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// ---- Init ----
loadTodos();
