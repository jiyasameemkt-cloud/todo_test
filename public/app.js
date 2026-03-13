// ---- DOM References ----
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');

// ---- Fetch helpers ----

// ดึง todo ทั้งหมดจาก server แล้ว render
async function loadTodos() {
  const res = await fetch('/api/todos');
  const todos = await res.json();
  renderTodos(todos);
}

// เพิ่ม todo ใหม่ผ่าน POST
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

  // โหลดรายการใหม่หลังเพิ่มสำเร็จ
  loadTodos();
}

// toggle done/undone ของ todo ตาม id
async function toggleTodo(id) {
  await fetch(`/api/todos/${id}`, { method: 'PATCH' });
  loadTodos();
}

// ลบ todo ตาม id
async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  loadTodos();
}

// ---- Render ----

// สร้าง HTML จากข้อมูล todos array แล้วแสดงในหน้าเว็บ
function renderTodos(todos) {
  // ล้างรายการเดิมออก
  list.innerHTML = '';

  // ถ้าไม่มีรายการ แสดงข้อความ empty
  if (todos.length === 0) {
    list.innerHTML = '<p class="empty-msg">ยังไม่มีรายการ ลองเพิ่มดูสิ!</p>';
    return;
  }

  // วนสร้าง <li> สำหรับแต่ละ todo
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    // Checkbox — ติ๊กเพื่อ toggle สถานะ done
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // ข้อความ todo — ขีดทับถ้า done
    const span = document.createElement('span');
    span.className = 'todo-text' + (todo.done ? ' done' : '');
    span.textContent = todo.text;

    // ปุ่มลบ
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.title = 'ลบรายการ';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    // รวม element เข้าด้วยกัน
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// ---- Event Listeners ----

// คลิกปุ่ม "เพิ่ม"
addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addTodo(text);
});

// กด Enter ในช่อง input ก็เพิ่มได้เลย
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// ---- Init ----
// โหลด todo ทันทีเมื่อหน้าเว็บเปิด
loadTodos();
