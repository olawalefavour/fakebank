import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Load fake database
let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));

// Login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ message: "Login successful", user });
});

// Get account balance
app.get("/balance/:id", (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ balance: user.balance });
});

// Get transactions
app.get("/transactions/:id", (req, res) => {
  const tx = db.transactions.filter(t => t.userId === parseInt(req.params.id));
  res.json(tx);
});

// Mock transfer
app.post("/transfer", (req, res) => {
  const { fromId, toId, amount } = req.body;
  const sender = db.users.find(u => u.id === fromId);
  const receiver = db.users.find(u => u.id === toId);

  if (!sender || !receiver)
    return res.status(404).json({ message: "User not found" });

  if (sender.balance < amount)
    return res.status(400).json({ message: "Insufficient funds" });

  sender.balance -= amount;
  receiver.balance += amount;

  db.transactions.push({
    id: db.transactions.length + 1,
    userId: fromId,
    type: "transfer",
    amount,
    to: receiver.email,
    date: new Date().toISOString()
  });

  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));

  res.json({ message: "Transfer successful", newBalance: sender.balance });
});

app.listen(PORT, () =>
  console.log(`✅ NinoBank backend running on port ${PORT}`)
);
