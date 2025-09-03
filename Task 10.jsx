// App.jsx
export default function App() {
  const products = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: "$49.99",
      description: "High quality sound with noise cancellation.",
      image:
        "https://images.unsplash.com/photo-1583225151265-8f17e2e7d8b3?w=400&h=400&fit=crop",
    },
    {
      id: 2,
      name: "Smart Watch",
      price: "$89.99",
      description: "Track your fitness and notifications easily.",
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    },
    {
      id: 3,
      name: "Bluetooth Speaker",
      price: "$29.99",
      description: "Portable speaker with amazing bass.",
      image:
        "https://images.unsplash.com/photo-1585386959984-a4155223166a?w=400&h=400&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Product Card List</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow-lg rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-gray-600 text-sm">{product.description}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">
                  {product.price}
                </span>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
