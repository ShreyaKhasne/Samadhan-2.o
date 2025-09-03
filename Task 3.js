// 📘 Arrays & Objects + Student Marks Calculator

// Array of student objects (with nested subject marks)
const students = [
  {
    name: "Utkarsh",
    class: "8A",
    marks: { math: 85, science: 92, english: 78 }
  },
  {
    name: "Aarav",
    class: "8A",
    marks: { math: 55, science: 60, english: 65 }
  },
  {
    name: "Saipratik",
    class: "8B",
    marks: { math: 95, science: 88, english: 90 }
  }
];

// 1️⃣ Use map → Calculate total marks for each student
const studentTotals = students.map(student => {
  const total = Object.values(student.marks).reduce((sum, mark) => sum + mark, 0);
  return {
    name: student.name,
    class: student.class,
    totalMarks: total,
    average: (total / Object.keys(student.marks).length).toFixed(2)
  };
});

console.log("🔹 Student Totals & Averages:");
console.log(studentTotals);

// 2️⃣ Use filter → Find students who passed (average >= 60)
const passedStudents = studentTotals.filter(stu => stu.average >= 60);
console.log("\n✅ Passed Students:");
console.log(passedStudents);

// 3️⃣ Use reduce → Find class average of all students
const overallAverage =
  studentTotals.reduce((sum, stu) => sum + parseFloat(stu.average), 0) /
  studentTotals.length;

console.log(`\n📊 Overall Class Average: ${overallAverage.toFixed(2)}`);
