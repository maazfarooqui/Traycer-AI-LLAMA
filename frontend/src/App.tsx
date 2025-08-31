import { useState } from "react";
import axios from "axios";

function App() {
  const [task, setTask] = useState("");
  const [plans, setPlans] = useState<any[]>([]);

  // 🔹 Generate a plan from backend
  const handleGeneratePlan = async () => {
    if (!task.trim()) return;
    try {
      const res = await axios.post("http://localhost:3000/plan", { task });
      alert("Plan generated!");
      setPlans((prev) => [...prev, res.data]); // append new plan to UI
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan");
    }
  };

  // 🔹 Fetch all plans from backend
  const handleViewPlans = async () => {
    try {
      const res = await axios.get("http://localhost:3000/history");
      setPlans(res.data.history);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch plans");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">Traycer - AI Planner</h1>

      {/* Input + Generate Plan */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter a task..."
          className="px-3 py-2 rounded-lg text-black"
        />
        <button
          onClick={handleGeneratePlan}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500"
        >
          Generate Plan
        </button>
      </div>

      {/* View Plans */}
      <button
        onClick={handleViewPlans}
        className="mb-6 bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
      >
        All Plans
      </button>

      {/* Plans List */}
      <div className="w-full max-w-2xl space-y-4">
        {plans.map((p, idx) => (
          <div key={idx} className="bg-gray-800 p-4 rounded-lg">
            <h2 className="font-semibold text-lg">{p.task}</h2>
            <ul className="list-disc ml-6 mt-2">
              {p.plan.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
