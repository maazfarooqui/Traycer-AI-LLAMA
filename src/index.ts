import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

let history: { task: string; plan: string[] }[] = [];

// 🔹 AI-powered plan generator
async function generatePlanWithAI(task: string): Promise<string[]> {
  try {
   const response = await axios.post("http://localhost:11434/api/generate", {
  model: "tinyllama",
  prompt: `You are a planning assistant. The user will give you a task.
Generate a short, clear plan with only 3-5 steps. 
Do not add irrelevant setup steps. Be concise.

Task: ${task}`,
  stream: false,
});


    // AI response text
    const text: string = (response.data as { response: string }).response;
    // Split by lines and clean
    return text
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    console.error("AI generation failed:", error);
    return ["Step 1: Understand the task", "Step 2: Work on the task", "Step 3: Review results"];
  }
}

// 🔹 Create a plan
app.post("/plan", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task is required" });

  const plan = await generatePlanWithAI(task);
  const result = { task, plan };
history.push({ task, plan });


  res.json(result);
});

// 🔹 View history
app.get("/history", (req, res) => {
  res.json({ history });
});

app.get("/plan", (req, res)=>{
  res.json({history})
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Traycer API running at http://localhost:${PORT}`);
});
