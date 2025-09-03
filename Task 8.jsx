// 📘 React To-Do List (Lists & Events)
// Save this as src/App.jsx

import { useState } from "react";

function App() {
  const [task, setTask] = useState("");   // For input field
  const [tasks, setTasks] = useState([]); // For list of tasks

  // Add task
  const addTask = () => {
    if (task.trim() === "") return; // Ignore empty input
    setTasks([...tasks, task]);
    setTask(""); // Clear input after adding
  };

  // Remove task
  const removeTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  return (
    <div style={styles.app}>
      <h1>📝 To-Do List</h1>

      {/* Input + Add Button */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter a task..."
          style={styles.input}
        />
        <button onClick={addTask} style={styles.addBtn}>Add</button>
      </div>

      {/* Task List */}
      <ul style={styles.list}>
        {tasks.map((t, index) => (
          <li key={index} style={styles.listItem}>
            {t}
            <button onClick={() => removeTask(index)} style={styles.removeBtn}>
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Inline styles
const styles = {
  app: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    textAlign: "center",
  },
  inputArea: {
    marginBottom: "20px",
  },
  input: {
    padding: "8px",
    width: "200px",
    borderRadius: "5px",
    border: "1px solid #999",
    marginRight: "10px",
  },
  addBtn: {
    padding: "8px 12px",
    background: "#4cafef",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  listItem: {
    margin: "10px auto",
    padding: "8px",
    width: "250px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeBtn: {
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    padding: "5px 8px",
  },
};

export default App;
