import { Box, Paper, Typography, Avatar } from "@mui/material";
import type { ReactNode } from "react";

interface InfoCardProps {
  titulo: string;
  valor?: string | number;
  icone?: ReactNode;
  corFundo?: string;
  corIcone?: string;
}

export default function InfoCard({
  titulo,
  valor,
  icone,
  corFundo,
  corIcone,
}: InfoCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderRadius: 2,
        border: "1px solid #eee",
        width: 300,
        minHeight: 80,
      }}
    >
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {titulo}
        </Typography>
        <Typography variant="h6" fontWeight={600}>
          {valor ?? "—"}
        </Typography>
      </Box>

      <Avatar
        sx={{
          bgcolor: corFundo,
          color: corIcone,
          width: 36,
          height: 36,
        }}
      >
        {icone}
      </Avatar>
    </Paper>
  );
}