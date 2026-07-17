import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import LinksGruposWhatsApp from './LinksGruposWhatsApp'
import LinksHotmart from './LinksHotmart'

export default function ConfiguracoesGerais() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', minHeight: '100%', pb: 8 }}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: number) => setActiveTab(value)}
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            px: 1,
            border: '1px solid',
            borderColor: 'divider',
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48,
            },
          }}
        >
          <Tab label="Links de WhatsApp" />
          <Tab label="Links da Hotmart" />
        </Tabs>

        {activeTab === 0 && <LinksGruposWhatsApp />}
        {activeTab === 1 && <LinksHotmart />}
      </Box>
    </Box>
  )
}
