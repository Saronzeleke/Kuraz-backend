const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const port = 3000;
const dataFile = path.join(__dirname, "tasks.json");

app.use(express.json());

let tasks = [];

async function loadTasks() {
  try {
    const data = await fs.readFile(dataFile, "utf8");
    tasks = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(dataFile, "[]"); // Create file if missing
    } else {
      console.error("Error loading tasks:", error);
    }
  }
}

async function saveTasks() {
  await fs.writeFile(dataFile, JSON.stringify(tasks, null, 2));
}
// To get(Retrive) new task
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// To post(create) new task
app.post("/api/tasks", async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  await saveTasks();
  res.status(201).json(newTask);
});

// To put(update) the file
app.put("/api/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  task.completed = true;
  await saveTasks();
  res.json(task);
});

//  To delete task
app.delete("/api/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  tasks.splice(index, 1);
  await saveTasks();
  res.status(204).end();
});

// To filter tasks
app.get("/api/tasks/filter", (req, res) => {
  const { completed } = req.query;
  let filteredTasks = tasks;

  if (completed === "true") {
    filteredTasks = tasks.filter((t) => t.completed);
  } else if (completed === "false") {
    filteredTasks = tasks.filter((t) => !t.completed);
  }

  res.json(filteredTasks);
});

// To start server
loadTasks().then(() => {
  app.listen(port, () => {
    console.log(`🚀 API running at http://localhost:${port}/api/tasks`);
  });
});
