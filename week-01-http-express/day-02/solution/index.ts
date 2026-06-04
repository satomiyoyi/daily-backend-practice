import express from 'express';

const app = express();

const todos = [
    { id: 1, title: 'Learn TypeScript', done: false, createAt: new Date() },
    { id: 2, title: 'Build a REST API', done: false, createAt: new Date() },
    { id: 3, title: 'Write unit tests', done: false, createAt: new Date() },
];
app.get('/todos', (req, res) => {
    res.json(todos);
});

app.get('/todos/:id', (req, res) => {
    const { id } = req.params;
    const todo = todos.find(todo => todo.id === parseInt(id));
    if (todo) {
        res.json(todo);
    } else {
        res.status(404).json({ message: 'Todo not found' });
    }
});

app.use(express.json());
app.post('/todos', (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: 'Title is required and must be a string' });
    }
    const newTodo = { id: todos.length + 1, title, done: false, createAt: new Date() };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    const index = todos.findIndex(todo => todo.id === parseInt(id));
    if (index !== -1) {
        todos.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Todo not found' });
    }
});

app.listen(3003, () => {
    console.log('Server is running on http://localhost:3003');
});