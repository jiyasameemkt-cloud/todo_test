// นำเข้า express framework
const express = require('express');
const path = require('path');

// สร้าง express application
const app = express();

// อ่าน port จาก environment variable หรือใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

// Middleware: แปลง request body เป็น JSON
app.use(express.json());

// Serve static files จากโฟลเดอร์ /public
// เมื่อเข้า http://localhost:3000 จะโหลดไฟล์จาก public/
app.use(express.static(path.join(__dirname, 'public')));

// เก็บข้อมูล todo ไว้ใน memory (array)
let todos = [];
let nextId = 1;

// GET /api/todos — ดึง todo ทั้งหมด
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos — เพิ่ม todo ใหม่
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // ตรวจสอบว่า text ไม่ว่างเปล่า
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }

  const todo = {
    id: nextId++,
    text: text.trim(),
    done: false,
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id — toggle สถานะ done ของ todo
app.patch('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // สลับสถานะ done
  todo.done = !todo.done;
  res.json(todo);
});

// DELETE /api/todos/:id — ลบ todo ตาม id
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.status(204).send();
});

// เริ่มต้น server และฟังที่ PORT
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
