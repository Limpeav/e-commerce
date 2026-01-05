export const fetchProducts = async () => {
  //const res = await fetch("https://fakestoreapi.com/products");
  const res = await fetch("http://localhost:4000/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};
