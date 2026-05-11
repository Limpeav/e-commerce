import React, { useEffect, useState } from "react";
import { ProductController } from "../../controllers/productController";
import { config } from "../../config/index.js";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${config.API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(ProductController.sortByNewest(data)))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {products.map((product) => (
        <div
          key={product._id}
          className="border rounded p-4 shadow hover:shadow-lg transition"
        >
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-48 object-cover mb-4 rounded"
          />
          <h2 className="text-lg font-semibold">{product.title}</h2>
          <p className="text-gray-600">${product.price}</p>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
