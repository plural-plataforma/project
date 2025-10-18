import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessores = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Nenhum token de autenticação encontrado. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("https://dev-api.runasp.net/api/Professor/buscar", {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
            "Content-Type": "application/json",
          },
        });

        console.log("Resposta da API:", response.data);

        const professor = response.data?.objeto;
        setProfessores(professor ? [professor] : []);
      } catch (err) {
        setError("Erro ao carregar os professores. Verifique a conexão ou o token.");
        console.error("Erro na requisição:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessores();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={2} sx={{ backgroundColor: "#f5f7fa", padding: 2 }}>
          <Grid item xs={12}>
            <MDBox sx={{ fontSize: "1.25rem", fontWeight: 500, color: "#344767" }}>
              Gerenciamento de Professores
            </MDBox>
            <MDBox sx={{ fontSize: "0.875rem", color: "#7b809a" }}>
              Controle de acesso e informações dos professores
            </MDBox>
          </Grid>

          {/* Cards de Status */}
          <Grid item xs={12} sx={{ marginTop: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <ComplexStatisticsCard
                  color="info"
                  icon="person"
                  title="Professores Ativos"
                  count={professores.length}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon="hourglass_empty"
                  title="Pendentes"
                  count={0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={3}>
                <ComplexStatisticsCard
                  color="error"
                  icon="block"
                  title="Suspensos"
                  count={0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={3}>
                <ComplexStatisticsCard
                  color="primary"
                  icon="autorenew"
                  title="Renovações"
                  count={0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Grid item xs={12} sx={{ marginTop: 2 }}>
            <MDBox sx={{ display: "flex", gap: 2 }}>
              <MDBox sx={{ flexGrow: 1 }}>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d2d6da",
                  }}
                />
              </MDBox>
              <MDBox sx={{ display: "flex", gap: 1 }}>
                <select
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d2d6da",
                  }}
                >
                  <option value="">Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="suspenso">Suspenso</option>
                </select>
                <select
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d2d6da",
                  }}
                >
                  <option value="">Estado</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                </select>
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f9a825",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Filtrar
                </button>
              </MDBox>
            </MDBox>
          </Grid>

          {/* Tabela de Professores */}
          <Grid item xs={12} sx={{ marginTop: 2 }}>
            <MDBox sx={{ backgroundColor: "#ffffff", borderRadius: 1, boxShadow: 1, padding: 2 }}>
              {loading ? (
                <MDBox textAlign="center">Carregando...</MDBox>
              ) : error ? (
                <MDBox color="error" textAlign="center">
                  {error}
                </MDBox>
              ) : (
                <>
                  <Grid container spacing={1} sx={{ fontWeight: 500, color: "#344767" }}>
                    <Grid item xs={2}>
                      ID
                    </Grid>
                    <Grid item xs={3}>
                      Nome Completo
                    </Grid>
                    <Grid item xs={2}>
                      Telefone
                    </Grid>
                    <Grid item xs={2}>
                      Disciplinas
                    </Grid>
                    <Grid item xs={2}>
                      Estado
                    </Grid>
                    <Grid item xs={1}>
                      Ações
                    </Grid>
                  </Grid>
                  {professores.map((professor, index) => (
                    <Grid container spacing={1} sx={{ marginTop: 1 }} key={index}>
                      <Grid item xs={2}>
                        {professor.id ?? "Sem ID"}
                      </Grid>
                      <Grid item xs={3}>
                        {professor.nomeCompleto || "Sem nome"}
                      </Grid>
                      <Grid item xs={2}>
                        {professor.telefone || "Sem telefone"}
                      </Grid>
                      <Grid item xs={2}>
                        {Array.isArray(professor.disciplinas)
                          ? professor.disciplinas.join(", ")
                          : professor.disciplinas || "Sem disciplinas"}
                      </Grid>
                      <Grid item xs={2}>
                        {professor.estado || "Sem estado"}
                      </Grid>
                      <Grid item xs={1}>
                        <button
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#f9a825",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>
                      </Grid>
                    </Grid>
                  ))}
                </>
              )}
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
