// 📘 React Setup with Vite - Profile Card Component
// Save this as src/App.jsx

function ProfileCard({ name, age, hobby, image }) {
  return (
    <div style={styles.card}>
      <img src={image} alt={name} style={styles.image} />
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Hobby: {hobby}</p>
    </div>
  );
}

function App() {
  return (
    <div style={styles.app}>
      <h1>👨‍🎓 Student Profiles</h1>

      {/* Using props */}
      <ProfileCard
        name="Utkarsh"
        age={13}
        hobby="Cricket"
        image="https://via.placeholder.com/150"
      />

      <ProfileCard
        name="Aarav"
        age={13}
        hobby="Coding"
        image="https://via.placeholder.com/150"
      />

      <ProfileCard
        name="Saipratik"
        age={14}
        hobby="Robotics"
        image="https://via.placeholder.com/150"
      />
    </div>
  );
}

// Inline styles
const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    border: "2px solid #ccc",
    borderRadius: "10px",
    padding: "15px",
    margin: "10px",
    width: "200px",
    textAlign: "center",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
  },
  image: {
    borderRadius: "50%",
    width: "100px",
    height: "100px",
  },
};

export default App;
