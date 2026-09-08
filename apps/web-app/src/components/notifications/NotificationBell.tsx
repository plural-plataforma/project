import { useNavigate } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import type { Notificacao } from '@/types/notificacao'

export function NotificationBell() {
  const navigate = useNavigate()
  const { notificacoes, totalNaoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes()

  const handleSelecionar = (notificacao: Notificacao) => {
    if (!notificacao.lida) marcarComoLida(notificacao.id)
    if (notificacao.relatorioId) navigate(`/relatorios/${notificacao.relatorioId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
          <Bell size={20} />
          {totalNaoLidas > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
            >
              {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {totalNaoLidas > 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              onClick={() => marcarTodasComoLidas()}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notificacoes.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => handleSelecionar(n)}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <span className={`text-sm font-semibold ${n.lida ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {n.titulo}
                </span>
                <span className="text-xs text-muted-foreground">{n.mensagem}</span>
                <span className="text-[10px] text-muted-foreground">{dayjs(n.createdAt).format('DD/MM HH:mm')}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
