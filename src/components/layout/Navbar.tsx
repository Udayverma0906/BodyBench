function Navbar() {
  return (
    <nav className="w-full px-6 py-5 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100">
      <h1 className="text-3xl font-bold text-gray-900">BodyBench</h1>

      <div className="flex gap-4 items-center">
        <button className="text-gray-700 font-medium hover:text-blue-600 transition">
          Login
        </button>

      </div>
    </nav>
  );
}

export default Navbar;