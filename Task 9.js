// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // Assuming you have a default CSS file

function App() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect runs after the component renders
  useEffect(() => {
    // This function fetches data from the backend
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/students');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []); // The empty array ensures this effect runs only once on mount.

  // Conditional rendering based on state
  if (isLoading) {
    return <div>Loading student data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Student Directory</h1>
        <ul>
          {students.map(student => (
            <li key={student.id}>
              <strong>{student.name}</strong> - {student.major}
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;