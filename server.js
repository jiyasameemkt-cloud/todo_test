const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- In-memory store ----
let todos = [];
let nextId = 1;

// ---- Helper ----

// แปลง :id param เป็น integer แล้วคืน null ถ้าไม่ใช่ตัวเลข
function parseId(param) {
  const id = parseInt(param, 10);
  return Number.isNaN(id) ? null : id;
}

// ---- Routes ----

// GET /api/todos
// คืน todo ทั้งหมดในรูปแบบ { data: [...], total: n }
app.get('/api/todos', (req, res) => {
  res.json({ data: todos, total: todos.length });
});

// POST /api/todos
// body: { text: string }
// คืน todo ที่สร้างใหม่พร้อม status 201
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // ตรวจสอบว่า text มีค่าและไม่ว่างเปล่า
  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text is required and must be a non-empty string' });
  }

  const todo = {
    id: nextId++,
    text: text.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PUT /api/todos/:id
// toggle สถานะ done/undone ของ todo
// คืน todo ที่อัพเดตแล้ว
app.put('/api/todos/:id', (req, res) => {
  const id = parseId(req.params.id);

  // ตรวจสอบว่า id เป็นตัวเลขที่ถูกต้อง
  if (id === null) {
    return res.status(400).json({ error: 'id must be a valid integer' });
  }

  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  // toggle done
  todo.done = !todo.done;
  res.json(todo);
});

// DELETE /api/todos/:id
// ลบ todo ตาม id แล้วคืน 200 พร้อม todo ที่ถูกลบ
app.delete('/api/todos/:id', (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'id must be a valid integer' });
  }

  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  // ตัดออกจาก array แล้วส่ง todo ที่ลบกลับไปด้วย
  const [deleted] = todos.splice(index, 1);
  res.json(deleted);
});

// ---- 404 handler (route ที่ไม่มี) ----
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// ---- Global error handler ----
// รับ error ที่ถูกโยนจาก middleware หรือ route ใดก็ตาม
// เช่น express.json() โยน SyntaxError เมื่อ body ไม่ใช่ JSON ที่ถูกต้อง
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
