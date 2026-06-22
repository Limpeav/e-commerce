import Navbar from "../components/Navbar/Navbar";

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">{children}</main>
    </>
  );
}
