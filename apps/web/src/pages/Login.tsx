import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // simulação de login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log("Login com:", email, password);
    // redireciona para o Dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
      {/* logo */}
        <div className="p-4 border-b">
          <img src="/logo-plural-plataforma.png" alt="Plural Logo" className="h-10 mx-auto" />
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}