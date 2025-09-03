// 📘 React State Management Example
// Save this as src/App.jsx

import { useState } from "react";

function App() {
  // State for counter
  const [count, setCount] = useState(0);

  // State for text input
  const [text, setText] = useState("");

  return (
    <div style={styles.app}>
      <h1>⚛️ State Management Demo</h1>

      {/* Counter Section */}
      <div style={styles.section}>
        <h2>🔢 Counter</h2>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)} style={styles.btn}>
          ➕ Increase
        </button>
        <button onClick={() => setCount(count - 1)} style={styles.btn}>
          ➖ Decrease
        </button>
        <button onClick={() => setCount(0)} style={styles.btn}>
          🔄 Reset
        </button>
      </div>

      {/* Live Text Preview Section */}
      <div style={styles.section}>
        <h2>✍️ Live Text Preview</h2>
        <input
          type="text"
          placeholder="Type something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.input}
        />
        <p>Preview: <b>{text}</b></p>
      </div>
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
  section: {
    margin: "20px",
    padding: "15px",
    border: "2px solid #ccc",
    borderRadius: "10px",
    display: "inline-block",
    minWidth: "250px",
  },
  btn: {
    margin: "5px",
    padding: "10px 15px",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "6px",
    border: "none",
    background: "#4cafef",
    color: "#fff",
  },
  input: {
    marginTop: "10px",
    padding: "8px",
    width: "80%",
    borderRadius: "5px",
    border: "1px solid #999",
  },
};

export default App;
