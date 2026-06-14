import { useState } from 'react'
import { DownloadSimple, FileDoc, FilePdf } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DownloadFormatMenuProps {
  ariaLabel: string
  label?: string
  disabled?: boolean
  onPdf: () => void | Promise<void>
  onWord: () => void | Promise<void>
}

/** Menu Baixar → PDF / Word reutilizado em PAEE, avaliações etc. */
export function DownloadFormatMenu({
  ariaLabel,
  label = 'Baixar',
  disabled = false,
  onPdf,
  onWord,
}: DownloadFormatMenuProps) {
  const [baixando, setBaixando] = useState<'pdf' | 'word' | null>(null)

  async function handleDownload(formato: 'pdf' | 'word', handler: () => void | Promise<void>) {
    setBaixando(formato)
    try {
      await handler()
    } finally {
      setBaixando(null)
    }
  }

  const isBusy = disabled || baixando != null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={isBusy} aria-label={ariaLabel}>
          <DownloadSimple size={14} />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={isBusy} onClick={() => void handleDownload('pdf', onPdf)}>
          <FilePdf size={14} className="mr-2" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isBusy} onClick={() => void handleDownload('word', onWord)}>
          <FileDoc size={14} className="mr-2" />
          Word
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
