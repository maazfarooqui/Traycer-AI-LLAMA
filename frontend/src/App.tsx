import { useState } from "react";

interface Plan {
  id?: string;
  task: string;
  plan: string[];
  confirmed?: boolean;
  createdAt?: string;
}

function App() {
  const [task, setTask] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  // Generate a new plan
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

      setPlans((prev) => [...prev, { ...data, confirmed: false }]);
      setTask("");
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all plans from backend
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

  // Send edit prompt to AI to modify the plan
  const handleEditWithAI = async (index: number) => {
    if (!editPrompt.trim()) return;
    
    setIsLoading(true);
    try {
      const currentPlan = plans[index];
      const response = await fetch("http://localhost:3000/plan/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTask: currentPlan.task,
          originalPlan: currentPlan.plan,
          editPrompt: editPrompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to edit plan");
      const updatedPlan = await response.json();

      const updatedPlans = [...plans];
      updatedPlans[index] = { 
        ...updatedPlan, 
        confirmed: false // Reset confirmation status after edit
      };
      setPlans(updatedPlans);

      setEditingIndex(null);
      setEditPrompt("");
      alert("Plan updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to edit plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm/lock down the plan
  const handleConfirmPlan = async (index: number) => {
    try {
      const response = await fetch(`http://localhost:3000/plan/${index}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plans[index].id || index }),
      });
      
      if (!response.ok) throw new Error("Failed to confirm plan");

      const updatedPlans = [...plans];
      updatedPlans[index] = { ...updatedPlans[index], confirmed: true };
      setPlans(updatedPlans);

      alert("Plan confirmed and locked!");
    } catch (err) {
      console.error(err);
      alert("Failed to confirm plan");
    }
  };

  // Delete a plan
  const handleDeletePlan = async (index: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/plan/${index}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plans[index].id || index }),
      });

      if (!response.ok) throw new Error("Failed to delete plan");

      const updatedPlans = plans.filter((_, i) => i !== index);
      setPlans(updatedPlans);
      
      alert("Plan deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete plan");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGeneratePlan();
    }
  };

  // Handle Enter key press for edit
  const handleEditKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleEditWithAI(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-12 min-h-screen flex flex-col">
        
        {/* Header Section */}
        <div className="text-center mb-16 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Traycer - AI Planner
          </h1>
          <p className="text-gray-300 text-lg">
            Transform your ideas into actionable plans
          </p>
        </div>

        {/* Input Section */}
        <div className="flex flex-col items-center mb-16 space-y-8">
          
          {/* Task Input and Generate Button */}
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a task..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />
            <button
              onClick={handleGeneratePlan}
              disabled={!task.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
            >
              {isLoading ? "Generating..." : "Generate Plan"}
            </button>
          </div>

          {/* View All Plans Button */}
          <button
            onClick={handleViewPlans}
            disabled={isLoading}
            className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
          >
            {isLoading ? "Loading..." : "All Plans"}
          </button>
        </div>

        {/* Plans Display Section */}
        <div className="flex-1">
          {plans.length > 0 && (
            <div className="w-full max-w-7xl mx-auto">
              <h2 className="text-2xl font-semibold mb-8 text-center text-gray-200">
                Your Plans ({plans.length})
              </h2>
              
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-xl border transition-all duration-200 h-fit ${
                      plan.confirmed 
                        ? 'border-green-500 ring-2 ring-green-500/20' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {/* Status Badge */}
                    {plan.confirmed && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                          ✓ Confirmed
                        </span>
                      </div>
                    )}

                    {/* Plan Title */}
                    <h3 className="font-bold text-xl mb-4 text-blue-300">
                      {plan.task}
                    </h3>
                    
                    {/* Plan Steps */}
                    <div className="space-y-2 mb-6">
                      {plan.plan.map((step: string, i: number) => (
                        <div 
                          key={i} 
                          className="flex items-start gap-3 p-2 rounded-lg bg-gray-600/30"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-gray-200 leading-relaxed text-sm">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Edit Mode */}
                    {editingIndex === idx && (
                      <div className="mb-4 p-4 bg-gray-600/50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tell AI how to modify this plan:
                        </label>
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          onKeyPress={(e) => handleEditKeyPress(e, idx)}
                          placeholder="e.g., 'Make it shorter', 'Add more detail', 'Focus on budget constraints'..."
                          className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleEditWithAI(idx)}
                            disabled={!editPrompt.trim() || isLoading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            {isLoading ? "Editing..." : "Edit with AI"}
                          </button>
                          <button
                            onClick={() => { setEditingIndex(null); setEditPrompt(""); }}
                            className="bg-gray-500 hover:bg-gray-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {editingIndex !== idx && (
                      <div className="flex gap-2 justify-between">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { 
                              setEditingIndex(idx); 
                              setEditPrompt(""); 
                            }}
                            disabled={plan.confirmed || isLoading}
                            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleConfirmPlan(idx)}
                            disabled={plan.confirmed || isLoading}
                            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                          >
                            {plan.confirmed ? "✓ Locked" : "🔒 Confirm"}
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleDeletePlan(idx)}
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && (
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-400 text-lg">
                No plans yet. Create your first plan above!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;