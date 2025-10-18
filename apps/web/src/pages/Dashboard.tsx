import { useState, useEffect } from "react";
import axios from "axios";
import { SignOut } from "../components/SignOut";
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
} from "@mui/material";

interface Professor {
  id: number;
  nomeCompleto: string;
  telefone?: string;
  disciplinas?: string[] | string;
  estado?: string;
}

export default function Dashboard() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const signOut = SignOut(); 

  useEffect(() => {
    const fetchProfessores = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

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
        if (Array.isArray(professor)) {
          setProfessores(professor);
        } else if (professor) {
          setProfessores([professor]);
        } else {
          setProfessores([]);
        }
      } catch (err) {
        console.error("Erro na requisição:", err);
        setError("Erro ao carregar os professores. Verifique o token ou a conexão.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessores();
  }, []);

  const filteredProfessores = professores.filter((p) =>
    p.nomeCompleto?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 256 },
          bgcolor: "white",
          borderRight: 1,
          borderColor: "grey.300",
          boxShadow: 1,
          position: { md: "sticky" },
          top: 0,
          height: { md: "100vh" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "grey.300", textAlign: "center" }}>
          <img src="/logo-plural-plataforma.png" alt="Plural Logo" style={{ height: 40 }} />
        </Box>

        {/* Navegação */}
        <Box sx={{ display: "flex", flexDirection: "column", p: 2, gap: 1, flexGrow: 1 }}>
          <Button variant="contained" color="warning" fullWidth>
            Gerenciar Usuários
          </Button>
          <Button variant="outlined" fullWidth>
            Pagamentos
          </Button>
          <Button variant="outlined" fullWidth>
            Relatórios
          </Button>
          <Button variant="outlined" fullWidth>
            Configurações
          </Button>
          <Button variant="outlined" fullWidth onClick={signOut}>
            Sair
          </Button>
        </Box>

        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
          >
            Sair
          </Button>
        </Box>
      </Box>

      {/* Conteúdo principal */}
      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 }, overflowY: "auto" }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Gerenciamento de Professores
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Controle de acesso e informações dos professores
        </Typography>

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
            placeholder="Buscar por nome ou email..."
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select defaultValue="" sx={{ minWidth: 120 }}>
            <MenuItem value="">Status</MenuItem>
          </Select>
          <Select defaultValue="" sx={{ minWidth: 120 }}>
            <MenuItem value="">Estado</MenuItem>
          </Select>
          <Button variant="contained" color="warning">
            Filtrar
          </Button>
        </Box>

        {/* Conteúdo principal */}
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
                  <TableCell>Nome</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Disciplinas</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProfessores.map((prof) => (
                  <TableRow key={prof.id}>
                    <TableCell>{prof.id}</TableCell>
                    <TableCell>{prof.nomeCompleto}</TableCell>
                    <TableCell>{prof.telefone || "—"}</TableCell>
                    <TableCell>
                      {Array.isArray(prof.disciplinas)
                        ? prof.disciplinas.join(", ")
                        : prof.disciplinas || "—"}
                    </TableCell>
                    <TableCell>{prof.estado || "—"}</TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" color="warning">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
