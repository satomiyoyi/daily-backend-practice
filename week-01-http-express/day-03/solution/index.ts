import express from 'express';

const app = express();

const router = express.Router();

app.use(express.json());
const todos = [
    { id: 1, title: 'Learn TypeScript', done: false, createdAt: new Date() },
    { id: 2, title: 'Build a REST API', done: false, createdAt: new Date() },
    { id: 3, title: 'Write unit tests', done: false, createdAt: new Date() },
];
let nextId = 4;

app.get('/todos', (req, res) => {
    res.json(todos);
});

router.get('/hello', (req, res) => {
  res.send('hello');
});

app.use('/api', router);

app.get('/todos/:id', (req, res) => {
    const { id } = req.params;
    const todo = todos.find(todo => todo.id === parseInt(id));
    if (todo) {
        res.json(todo);
    } else {
        res.status(404).json({ message: 'Todo not found' });
    }
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

// 请求日志中间件
app.use((req, res, next) => {
    const requestStart = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - requestStart;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// post请求体验证中间件
app.post('/todos', (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: 'Title is required and must be a string' });
    }
    const newTodo = { id: nextId++, title, done: false, createdAt: new Date() };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// 错误处理中间件
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});