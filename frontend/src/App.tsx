import { useState } from "react";

function App() {
  const [task, setTask] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Generate a plan
  const handleGeneratePlan = async () => {
    if (!task.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");
      const data = await response.json();

      setPlans((prev) => [...prev, data]);
      setTask("");
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  // View all plans
  const handleViewPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/history");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data.history);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch plans");
    } finally {
      setIsLoading(false);
    }
  };

  // Edit plan
  const handleEditPlan = async (index: number) => {
    if (!editText.trim()) return;
    try {
      const response = await fetch(`http://localhost:3000/plan/${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: editText, plan: plans[index].plan }),
      });

      if (!response.ok) throw new Error("Failed to edit plan");
      const updated = await response.json();

      const updatedPlans = [...plans];
      updatedPlans[index] = updated;
      setPlans(updatedPlans);

      setEditingIndex(null);
      setEditText("");
    } catch (err) {
      console.error(err);
      alert("Failed to edit plan");
    }
  };

  // Confirm/finalize plan
  const handleConfirmPlan = async (index: number) => {
    try {
      const response = await fetch(`http://localhost:3000/plan/${index}/accept`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to confirm plan");

      alert("Plan confirmed!");
    } catch (err) {
      console.error(err);
      alert("Failed to confirm plan");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-12 min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-16 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Traycer - AI Planner
          </h1>
          <p className="text-gray-300 text-lg">Transform your ideas into actionable plans</p>
        </div>

        {/* Input */}
        <div className="flex flex-col items-center mb-16 space-y-8">
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter a task..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
              disabled={isLoading}
            />
            <button
              onClick={handleGeneratePlan}
              disabled={!task.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-xl hover:from-blue-500 hover:to-blue-600 font-semibold shadow-lg"
            >
              {isLoading ? "Generating..." : "Generate Plan"}
            </button>
          </div>

          <button
            onClick={handleViewPlans}
            disabled={isLoading}
            className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 font-semibold shadow-lg"
          >
            {isLoading ? "Loading..." : "All Plans"}
          </button>
        </div>

        {/* Plans */}
        <div className="flex-1">
          {plans.length > 0 && (
            <div className="w-full max-w-7xl mx-auto">
              <h2 className="text-2xl font-semibold mb-8 text-center text-gray-200">
                Your Plans ({plans.length})
              </h2>

              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-xl border border-gray-600">
                    
                    {/* Editable Title */}
                    {editingIndex === idx ? (
                      <div className="mb-4">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white focus:ring-2 focus:ring-blue-400"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleEditPlan(idx)}
                            className="bg-blue-600 px-4 py-2 rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingIndex(null); setEditText(""); }}
                            className="bg-gray-500 px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h3 className="font-bold text-xl mb-4 text-blue-300">
                        {plan.task}
                      </h3>
                    )}

                    {/* Steps */}
                    <div className="space-y-2 mb-4">
                      {plan.plan.map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-600/30">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-gray-200 text-sm">{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingIndex(idx); setEditText(plan.task); }}
                        className="bg-yellow-500 px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleConfirmPlan(idx)}
                        className="bg-green-600 px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plans.length === 0 && (
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-400 text-lg">No plans yet. Create your first plan above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
