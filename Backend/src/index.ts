import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

interface Plan {
  id: string;
  task: string;
  plan: string[];
  confirmed: boolean;
  createdAt: string;
}

let history: Plan[] = [];
let finalPlan: Plan | null = null;

// Generate unique ID for plans
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

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

// 🔹 AI-powered plan editor
async function editPlanWithAI(originalTask: string, originalPlan: string[], editPrompt: string): Promise<{ task: string; plan: string[] }> {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "tinyllama",
      prompt: `You are a planning assistant. The user has an existing plan and wants to modify it.

Original Task: ${originalTask}
Original Plan:
${originalPlan.map((step, i) => `${i + 1}. ${step}`).join('\n')}

User's modification request: ${editPrompt}

Please provide an updated plan based on the user's request. Keep it 3-5 steps and be concise.
Respond with the updated task title and plan steps.`,
      stream: false,
    });

    const text: string = (response.data as { response: string }).response;
    const lines = text.split("\n").filter(line => line.trim().length > 0);
    
    // Try to extract task and plan from AI response
    let updatedTask = originalTask;
    let updatedPlan = lines.map(line => line.replace(/^\d+[\.\)]\s*/, "").trim()).filter(line => line.length > 0);
    
    // If the response seems to include a new task title, use it
    if (lines.length > 0 && !lines[0].match(/^\d+[\.\)]/)) {
      updatedTask = lines[0];
      updatedPlan = lines.slice(1).map(line => line.replace(/^\d+[\.\)]\s*/, "").trim()).filter(line => line.length > 0);
    }

    return {
      task: updatedTask,
      plan: updatedPlan.length > 0 ? updatedPlan : originalPlan
    };
  } catch (error) {
    console.error("AI edit failed:", error);
    return { task: originalTask, plan: originalPlan };
  }
}

// 🔹 Create a new plan
app.post("/plan", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task is required" });

  const plan = await generatePlanWithAI(task);
  const result: Plan = { 
    id: generateId(),
    task, 
    plan,
    confirmed: false,
    createdAt: new Date().toISOString()
  };
  history.push(result);

  res.json(result);
});

// 🔹 NEW: Edit a plan with AI assistance
app.post("/plan/edit", async (req, res) => {
  const { originalTask, originalPlan, editPrompt } = req.body;
  
  if (!originalTask || !originalPlan || !editPrompt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const editedPlan = await editPlanWithAI(originalTask, originalPlan, editPrompt);
    res.json({
      id: generateId(), // Generate new ID for edited plan
      task: editedPlan.task,
      plan: editedPlan.plan,
      confirmed: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Edit plan error:", error);
    res.status(500).json({ error: "Failed to edit plan" });
  }
});

// 🔹 View all plans (history)
app.get("/plans", (req, res) => {
  res.json({ history });
});

app.get("/history", (req, res) => {
  res.json({ history });
});

// 🔹 Edit/change a plan by index (existing route - kept for compatibility)
app.put("/plan/:index", (req, res) => {
  const { index } = req.params;
  const { task, plan } = req.body;

  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= history.length) {
    return res.status(400).json({ error: "Invalid plan index" });
  }

  if (history[i].confirmed) {
    return res.status(400).json({ error: "Cannot edit confirmed plan" });
  }

  if (task) history[i].task = task;
  if (plan) history[i].plan = plan;

  res.json({ message: "Plan updated", plan: history[i] });
});

// 🔹 NEW: Confirm/lock a plan
app.post("/plan/:index/confirm", (req, res) => {
  const { index } = req.params;
  const i = parseInt(index, 10);

  if (isNaN(i) || i < 0 || i >= history.length) {
    return res.status(400).json({ error: "Invalid plan index" });
  }

  history[i].confirmed = true;
  finalPlan = history[i]; // Also set as final plan

  res.json({ 
    message: "Plan confirmed and locked", 
    plan: history[i] 
  });
});

// 🔹 Accept/finalize a plan by index (existing route - kept for compatibility)
app.post("/plan/:index/accept", (req, res) => {
  const { index } = req.params;
  const i = parseInt(index, 10);

  if (isNaN(i) || i < 0 || i >= history.length) {
    return res.status(400).json({ error: "Invalid plan index" });
  }

  finalPlan = history[i];
  history[i].confirmed = true; // Also mark as confirmed
  
  res.json({ message: "Plan accepted as final", finalPlan });
});

// 🔹 NEW: Delete a plan
app.delete("/plan/:index", (req, res) => {
  const { index } = req.params;
  const i = parseInt(index, 10);

  if (isNaN(i) || i < 0 || i >= history.length) {
    return res.status(400).json({ error: "Invalid plan index" });
  }

  const deletedPlan = history[i];
  history.splice(i, 1);

  // If the deleted plan was the final plan, clear it
  if (finalPlan && finalPlan.id === deletedPlan.id) {
    finalPlan = null;
  }

  res.json({ 
    message: "Plan deleted successfully", 
    deletedPlan 
  });
});

// 🔹 View the ultimate (final) plan
app.get("/plan/final", (req, res) => {
  if (!finalPlan) {
    return res.status(404).json({ error: "No plan has been finalized yet" });
  }
  res.json({ finalPlan });
});

// 🔹 NEW: Get plan statistics
app.get("/stats", (req, res) => {
  const confirmedCount = history.filter(plan => plan.confirmed).length;
  const totalCount = history.length;
  
  res.json({
    totalPlans: totalCount,
    confirmedPlans: confirmedCount,
    unconfirmedPlans: totalCount - confirmedCount,
    hasFinalPlan: !!finalPlan
  });
});

// Server start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Traycer API running at http://localhost:${PORT}`);
  console.log(`Available routes:
  POST /plan - Generate new plan
  GET /history - Get all plans
  POST /plan/edit - Edit plan with llama
  POST /plan/:index/confirm - Confirm/lock plan  (Can't Edit)
  DELETE /plan/:index - Delete plan
  GET /plan/final - Get final accepted plan
  GET /stats - Get plan statistics`);
});