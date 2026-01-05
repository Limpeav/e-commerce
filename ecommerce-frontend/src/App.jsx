import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Navbar from "./components/Navbar/Navbar";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import Footer from "./components/Footer/Footer";
import Wishlist from "./pages/Wishlist";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  const location = useLocation();

  // Paths where Navbar and Footer should be hidden
  const hideNavFooter = ["/login", "/register"];

  const shouldShowNavFooter = !hideNavFooter.includes(location.pathname);

  return (
    <>
      {shouldShowNavFooter && <Navbar />}

      <Routes>
        {/* PUBLIC ROUTES - Login/Register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES - Require Login */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
      </Routes>

      {shouldShowNavFooter && <Footer />}
    </>
  );
}
export default App;
