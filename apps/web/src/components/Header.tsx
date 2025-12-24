import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Box, IconButton, Menu, MenuItem } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { SignOut } from "./SignOut";

export default function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const signOut = SignOut();
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangePassword = () => {
    navigate("/change-password");
    handleMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "#FFFF",
        zIndex: (theme) => theme.zIndex.drawer + 1, 
        width: "100%",
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 2 }}>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <img src="/logo-plural-plataforma.png" alt="Plural Logo" style={{ height: 40 }} onClick={() => navigate("/dashboard")} />
        </Box>
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          aria-label="menu de usuário"
          sx={{ color: "#000000" }}
        >
          <PersonIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleChangePassword}>Trocar Senha</MenuItem>
          <MenuItem onClick={signOut}>Sair</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}