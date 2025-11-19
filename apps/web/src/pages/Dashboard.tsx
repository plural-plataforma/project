import { useState, useEffect } from "react";
import axios from "axios";
import { SignOut } from "../components/SignOut";
import PersonIcon from "@mui/icons-material/Person";
import InfoCard from "../components/InfoCard";

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
  Menu
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
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "grey.300", textAlign: "center", color: "#276678" }}>
          <img src="/logo-plural-plataforma.png" alt="Plural Logo" style={{ height: 40 }} />
        </Box>

        {/* Navegação */}
        <Box sx={{ display: "flex", flexDirection: "column", p: 2, gap: 1, flexGrow: 1 }}>
          <Button variant="contained" fullWidth style={{ color: "#FFFF", backgroundColor: "#276678" }}>
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

        </Box>

        <Box sx={{ p: 2 }}>
          <Button
            style={{ color: "#FFFF", backgroundColor: "#276678" }}
            variant="outlined"
            fullWidth
            onClick={signOut}
          >
            Sair
          </Button>
        </Box>
      </Box>

      {/* Conteúdo principal */}
      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 }, overflowY: "auto" }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Gerenciamento de Usuários
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Controle de acesso e vínculos de professores
        </Typography>

        {/* cards de totalizadores */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
              <InfoCard
                titulo="Usuários Ativos"
                valor={professores.length}
                icone={<PersonIcon fontSize="small" />}
                corFundo="#f3e8ff"
                corIcone="#8b5cf6"
              />

          {/* Pendentes */}
            <InfoCard
              titulo="Pendentes"
              valor={5}
              icone={<PersonIcon fontSize="small" />}
              corFundo="#fff3cd"
              corIcone="#856404"
            />

          {/* Suspensos */}
          <InfoCard
            titulo="Suspensos"
            valor={2}
            icone={<PersonIcon fontSize="small" />}
            corFundo="#f8d7da"
            corIcone="#721c24"
          />

          {/* Renovações */}
          <InfoCard
            titulo="Renovações"
            valor={1}
            icone={<PersonIcon fontSize="small" />}
            corFundo="#d1e7dd"
            corIcone="#0f5132"
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
            placeholder="Buscar por nome ou email..."
            fullWidth
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select defaultValue="">
              <MenuItem value="">Ativo</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="suspenso">Suspenso</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Plano</InputLabel>
            <Select defaultValue="">
              <MenuItem value="">Premium</MenuItem>
              <MenuItem value="basico">Básico</MenuItem>
              <MenuItem value="gratuito">Gratuito</MenuItem>
              <MenuItem value="empresarial">Empresarial</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            sx={{
              color: "#FFF",
              backgroundColor: "#276678",
              height: "40px", // define altura fixa igual aos inputs small
              textTransform: "none",
            }}
          >
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
                      <Button size="small" variant="contained" style={{ color: "#FFFF", backgroundColor: "#276678" }}>
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
