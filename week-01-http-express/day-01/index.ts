import express from 'express';
import { uptime } from 'node:process';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3002, () => {
  console.log('Server is running on http://localhost:3002');
});

app.use(express.json());
app.post("/echo", (req, res) => {
  res.send(req.body);
});

app.get("/health", (req, res) => {
  res.send({ status: "OK", uptime: Date.now() });
});