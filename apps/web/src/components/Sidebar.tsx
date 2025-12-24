// src/components/Sidebar.tsx
import { Box, Button } from "@mui/material";

interface SidebarProps {
  activeRoute?: string; // opcional: para destacar a página atual
  onSignOut: () => void;
}

export default function Sidebar({ activeRoute = "", onSignOut }: SidebarProps) {
  const isActive = (route: string) => activeRoute === route;

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: "100%", md: 256 },
        bgcolor: "white",
        borderRight: 1,
        borderColor: "grey.300",
        boxShadow: 1,
        position: { md: "sticky" },
        top: 64,
        height: { md: "calc(100vh - 64px)" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", p: 2, gap: 1, flexGrow: 1 }}>
        <Button
          variant={isActive("/dashboard") ? "contained" : "outlined"}
          fullWidth
          component="a"
          href="/dashboard"
          sx={{
            bgcolor: isActive("/dashboard") ? "#276678" : "transparent",
            color: isActive("/dashboard") ? "#fff" : "inherit",
          }}
        >
          Gerenciar Usuários
        </Button>

        <Button
          variant={isActive("/skills") ? "contained" : "outlined"}
          fullWidth
          component="a"
          href="/skills"
          sx={{
            bgcolor: isActive("/skills") ? "#276678" : "transparent",
            color: isActive("/skills") ? "#fff" : "inherit",
          }}
        >
          Habilidades
        </Button>

        
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onSignOut}
          sx={{ bgcolor: "#276678", color: "#fff" }}
        >
          Sair
        </Button>
      </Box>
    </Box>
  );
}