export default function Dashboard() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r shadow-sm md:h-screen md:sticky md:top-0">
        {/* Logo */}
        <div className="p-4 border-b">
          <img src="/logo-plural-plataforma.png" alt="Plural Logo" className="h-10 mx-auto" />
        </div>
        {/* Navegação */}
        <nav className="space-y-2 px-4 py-4">
          <a href="#" className="flex items-center p-2 rounded-lg bg-yellow-400 text-white">
            Gerenciar Usuários
          </a>
          <a href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
            Pagamentos
          </a>
          <a href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
            Relatórios
          </a>
          <a href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
            Configurações
          </a>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
        <p className="text-gray-600 mb-6">Controle de acesso e vínculos de professoras</p>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-lg sm:text-xl font-bold">247</p>
            <p className="text-gray-500">Usuários Ativos</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-lg sm:text-xl font-bold">18</p>
            <p className="text-gray-500">Pendentes</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-lg sm:text-xl font-bold">5</p>
            <p className="text-gray-500">Suspensos</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-lg sm:text-xl font-bold">32</p>
            <p className="text-gray-500">Renovações</p>
          </div>
        </div>

        {/* Barra de filtro */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full sm:flex-1 border px-3 py-2 rounded-lg"
          />
          <select className="w-full sm:w-auto border px-2 py-2 rounded-lg">
            <option>Status</option>
          </select>
          <select className="w-full sm:w-auto border px-2 py-2 rounded-lg">
            <option>Plano</option>
          </select>
          <button className="w-full sm:w-auto bg-yellow-400 px-4 py-2 rounded-lg text-white">
            Filtrar
          </button>
        </div>

        {/* Tabela de usuários */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-sm sm:text-base">Usuário</th>
                <th className="p-3 text-sm sm:text-base">Status</th>
                <th className="p-3 text-sm sm:text-base">Plano</th>
                <th className="p-3 text-sm sm:text-base">Vencimento</th>
                <th className="p-3 text-sm sm:text-base">Hotmart ID</th>
                <th className="p-3 text-sm sm:text-base">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">
                  Maria Silva <br />
                  <span className="text-xs sm:text-sm text-gray-500">maria.silva@email.com</span>
                </td>
                <td className="p-3">
                  <span className="text-green-600 font-semibold">Ativo</span>
                </td>
                <td className="p-3">Anual</td>
                <td className="p-3">15/12/2025</td>
                <td className="p-3">HTM-789456</td>
                <td className="p-3"></td>
              </tr>
              <tr className="border-b">
                <td className="p-3">
                  Ana Costa <br />
                  <span className="text-xs sm:text-sm text-gray-500">ana.costa@email.com</span>
                </td>
                <td className="p-3">
                  <span className="text-yellow-600 font-semibold">Pendente</span>
                </td>
                <td className="p-3">Mensal</td>
                <td className="p-3">28/01/2025</td>
                <td className="p-3">HTM-123789</td>
                <td className="p-3"></td>
              </tr>
              <tr>
                <td className="p-3">
                  Carla Oliveira <br />
                  <span className="text-xs sm:text-sm text-gray-500">carla.oliveira@email.com</span>
                </td>
                <td className="p-3">
                  <span className="text-red-600 font-semibold">Suspenso</span>
                </td>
                <td className="p-3">Trimestral</td>
                <td className="p-3">05/11/2024</td>
                <td className="p-3">HTM-456123</td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}