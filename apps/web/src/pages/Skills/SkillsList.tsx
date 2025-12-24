import { useState, useEffect } from "react";
import axios from "axios";
import { SignOut } from "../../components/SignOut";
import PersonIcon from "@mui/icons-material/Person";
import InfoCard from "../../components/InfoCard";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  TablePagination,
} from "@mui/material";
import Sidebar from "../../components/Sidebar";

interface Habilidade {
  id: number;
  tipo: string;
  descricao: string;
  resumo: string;
  ativo: boolean;
  idnivelensino: number;
}

export default function SkillsList() {
  const [habilidades, setHabilidades] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const signOut = SignOut();

  useEffect(() => {
    const fetchHabilidades = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Nenhum token de autenticação encontrado. Faça login novamente.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/Habilidade/buscar`, {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
            "Content-Type": "application/json",
          },
        });
        const Habilidades = response.data?.objeto;
        if (Array.isArray(Habilidades)) {
          setHabilidades(Habilidades);
        } else if (Habilidades) {
          setHabilidades([Habilidades]);
        } else {
          setHabilidades([]);
        }
      } catch (err) {
        console.error("Erro na requisição:", err);
        setError("Erro ao carregar as Habilidades.");
      } finally {
        setLoading(false);
      }
    };
    fetchHabilidades();
  }, []);

  // FILTRO COMPLETO (busca + status)
  const filteredHabilidades = habilidades.filter((h) => {
    const matchesSearch =
      (h.descricao?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (h.resumo?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "ativo" && h.ativo) ||
      (statusFilter === "inativo" && !h.ativo);

    return matchesSearch && matchesStatus;
  });

  // Paginação
  const paginatedHabilidades = filteredHabilidades.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset página ao filtrar
  const resetPage = () => setPage(0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, flex: 1 }}>
        {/* Sidebar */}
       <Sidebar activeRoute="/skills" onSignOut={signOut} />

        {/* Conteúdo principal */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 }, overflowY: "auto" }}>
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Gerenciamento de Habilidades
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Controle de acesso e vínculos de habilidades
          </Typography>

          {/* Cards */}
          <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
            <InfoCard
              titulo="Habilidades Ativas"
              valor={habilidades.filter((h) => h.ativo).length}
              icone={<PersonIcon fontSize="small" />}
              corFundo="#f3e8ff"
              corIcone="#8b5cf6"
            />
            <InfoCard
              titulo="Habilidades Inativas"
              valor={habilidades.filter((h) => !h.ativo).length}
              icone={<PersonIcon fontSize="small" />}
              corFundo="#fff3cd"
              corIcone="#856404"
            />
          </Box>

          {/* Filtros */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              mb: 3,
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Buscar por descrição ou resumo..."
              fullWidth
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  resetPage();
                }}
                label="Status"
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              sx={{
                color: "#FFF",
                backgroundColor: "#276678",
                heightHeight: "40px",
                textTransform: "none",
              }}
              onClick={resetPage}
            >
              Filtrar
            </Button>
          </Box>

          {/* Tabela */}
          {loading ? (
            <Box textAlign="center" mt={5}>
              <CircularProgress color="warning" />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <Paper sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 640 }}>
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Resumo</TableCell>
                    <TableCell>Ativo</TableCell>
                    <TableCell>Nível Ensino</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHabilidades.map((hab) => (
                    <TableRow key={hab.id}>
                      <TableCell>{hab.id}</TableCell>
                      <TableCell>{hab.tipo}</TableCell>
                      <TableCell>{hab.descricao}</TableCell>
                      <TableCell>{hab.resumo}</TableCell>
                      <TableCell>{hab.ativo ? "Sim" : "Não"}</TableCell>
                      <TableCell>{hab.idnivelensino}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          style={{ color: "#FFFF", backgroundColor: "#276678" }}
                          onClick={() =>
                            navigate("/skills/edit", {
                              state: {
                                id: hab.id,
                                tipo: hab.tipo,
                                descricao: hab.descricao,
                                resumo: hab.resumo,
                                ativo: hab.ativo,
                                idnivelensino: hab.idnivelensino,
                              },
                            })
                          }
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={filteredHabilidades.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage="Registros por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count}`
                }
                sx={{ borderTop: "1px solid rgba(224, 224, 224, 1)" }}
              />
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}