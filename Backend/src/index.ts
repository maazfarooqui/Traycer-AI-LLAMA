import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

let history: { task: string; plan: string[] }[] = [];
let finalPlan: { task: string; plan: string[] } | null = null; // store accepted plan

// 🔹 AI-powered plan generator
async function generatePlanWithAI(task: string): Promise<string[]> {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "tinyllama",
      prompt: `You are a planning assistant for coding tasks. The user will give you a task.
Generate a short, clear plan with only 3-5 steps on how to best achieve the project. 
Do not add irrelevant setup steps. Be concise.

Task: ${task}`,
      stream: false,
    });

    const text: string = (response.data as { response: string }).response;

    return text
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    console.error("AI generation failed:", error);
    return [
      "Step 1: Understand the task",
      "Step 2: Work on the task",
      "Step 3: Review results",
    ];
  }
}

// 🔹 Create a new plan
app.post("/plan", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task is required" });

  const plan = await generatePlanWithAI(task);
  const result = { task, plan };
  history.push(result);

  res.json(result);
});

// 🔹 View all plans (history)
app.get("/plans", (req, res) => {
  res.json({ history });
});

app.get("/history", (req, res)=>{
  res.json({ history });
})

// 🔹 Edit/change a plan by index
app.put("/plan/:index", (req, res) => {
  const { index } = req.params;
  const { task, plan } = req.body;

  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= history.length) {
    return res.status(400).json({ error: "Invalid plan index" });
  }

  if (task) history[i].task = task;
  if (plan) history[i].plan = plan;

  res.json({ message: "Plan updated", plan: history[i] });
});

// 🔹 Accept/finalize a plan by index
app.post("/plan/:index/accept", (req, res) => {
  const { index } = req.params;
  const i = parseInt(index, 10);

  if (isNaN(i) || i < 0 || i >= history.length) {
    return res.status(400).json({ error: "Invalid plan index" });
  }

  finalPlan = history[i];
  res.json({ message: "Plan accepted as final", finalPlan });
});

// 🔹 View the ultimate (final) plan
app.get("/plan/final", (req, res) => {
  if (!finalPlan) {
    return res.status(404).json({ error: "No plan has been finalized yet" });
  }
  res.json({ finalPlan });
});

// Server start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Traycer API running at http://localhost:${PORT}`);
});

