import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listarRelatoriosPorAluno,
  previewInsumosRelatorio,
  cadastrarRelatorio,
  buscarRelatorioPorId,
  atualizarSecaoRelatorio,
  finalizarRelatorio,
  reabrirRelatorio,
  duplicarRelatorio,
  gerarNovamenteRelatorio,
} from './relatorioService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('relatorioService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarRelatoriosPorAluno', () => {
    it('retorna a lista quando a API responde com sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [{ id: 1, alunoId: 5, alunoNome: 'Maria', status: 0 }],
        },
      })

      const result = await listarRelatoriosPorAluno({ alunoId: 5 })

      expect(result).toHaveLength(1)
      expect(api.get).toHaveBeenCalledWith('/Relatorio/listar', { params: { alunoId: 5 } })
    })

    it('retorna array vazio quando não há relatórios', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: true, listaObjetos: [] },
      })

      const result = await listarRelatoriosPorAluno({ alunoId: 5 })

      expect(result).toEqual([])
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Professor não identificado.'] },
      })

      await expect(listarRelatoriosPorAluno({ alunoId: 5 })).rejects.toThrow('Professor não identificado.')
    })
  })

  describe('previewInsumosRelatorio', () => {
    it('retorna prévia quando API responde com sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: {
            alunoNome: 'Maria',
            temEstudoCaso: true,
            quantidadePlanejamentosVigentes: 1,
            quantidadeRelatosNoPeriodo: 5,
            quantidadeRelatosComPresenca: 4,
            quantidadeAvaliacoesNoPeriodo: 1,
            periodoElegivelParaComparacaoEvolucao: false,
            avisos: [],
          },
        },
      })

      const result = await previewInsumosRelatorio({ alunoId: 1, dataInicio: '2026-01-01', dataFim: '2026-03-31' })

      expect(result.alunoNome).toBe('Maria')
      expect(result.quantidadeRelatosNoPeriodo).toBe(5)
      expect(api.get).toHaveBeenCalledWith('/Relatorio/preview-insumos', {
        params: { alunoId: 1, dataInicio: '2026-01-01', dataFim: '2026-03-31' },
      })
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Aluno não encontrado'] },
      })

      await expect(
        previewInsumosRelatorio({ alunoId: 99, dataInicio: '2026-01-01', dataFim: '2026-03-31' })
      ).rejects.toThrow('Aluno não encontrado')
    })
  })

  describe('cadastrarRelatorio', () => {
    it('retorna sucesso=true e o relatório quando a IA gera normalmente', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          sucesso: true,
          mensagens: ['Relatório gerado. Revise as seções antes de finalizar.'],
          objeto: { id: 10, secoes: [] },
        },
      })

      const result = await cadastrarRelatorio({
        alunoId: 1,
        dataInicio: '2026-01-01',
        dataFim: '2026-03-31',
        tipoPeriodo: 0,
      })

      expect(result.sucesso).toBe(true)
      expect(result.relatorio.id).toBe(10)
    })

    it('retorna sucesso=false mas ainda devolve o relatório quando só a geração por IA falhou', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          sucesso: false,
          mensagens: ['Relatório criado, mas a IA falhou. Você pode tentar gerar novamente.'],
          objeto: { id: 11, secoes: [] },
        },
      })

      const result = await cadastrarRelatorio({
        alunoId: 1,
        dataInicio: '2026-01-01',
        dataFim: '2026-03-31',
        tipoPeriodo: 1,
      })

      expect(result.sucesso).toBe(false)
      expect(result.relatorio.id).toBe(11)
      expect(result.mensagem).toContain('IA falhou')
    })

    it('lança erro quando a API não devolve o relatório', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Aluno não encontrado ou sem permissão.'], objeto: null },
      })

      await expect(
        cadastrarRelatorio({ alunoId: 99, dataInicio: '2026-01-01', dataFim: '2026-03-31', tipoPeriodo: 0 })
      ).rejects.toThrow('Aluno não encontrado ou sem permissão.')
    })
  })

  describe('gerarNovamenteRelatorio', () => {
    it('retorna sucesso=false mas ainda devolve o relatório quando a IA falhou de novo', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Erro ao gerar relatório: timeout'], objeto: { id: 11, secoes: [] } },
      })

      const result = await gerarNovamenteRelatorio(11)

      expect(result.sucesso).toBe(false)
      expect(result.relatorio.id).toBe(11)
    })

    it('lança erro quando relatório não encontrado', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Relatório não encontrado.'], objeto: null },
      })

      await expect(gerarNovamenteRelatorio(999)).rejects.toThrow('Relatório não encontrado.')
    })
  })

  describe('buscarRelatorioPorId', () => {
    it('retorna relatório quando encontrado', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: true, objeto: { id: 5, alunoNome: 'João', secoes: [] } },
      })

      const result = await buscarRelatorioPorId(5)

      expect(result.id).toBe(5)
      expect(result.alunoNome).toBe('João')
    })

    it('lança erro quando não encontrado', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Relatório não encontrado.'] },
      })

      await expect(buscarRelatorioPorId(999)).rejects.toThrow('Relatório não encontrado.')
    })
  })

  describe('atualizarSecaoRelatorio', () => {
    it('envia payload correto e retorna relatório atualizado', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: { sucesso: true, objeto: { id: 5, secoes: [] } },
      })

      const result = await atualizarSecaoRelatorio(5, {
        secaoChave: 0,
        textoEditado: 'Texto revisado',
        notasManuais: 'Nota',
      })

      expect(result.id).toBe(5)
      expect(api.patch).toHaveBeenCalledWith('/Relatorio/5/secoes', {
        secaoChave: 0,
        textoEditado: 'Texto revisado',
        notasManuais: 'Nota',
      })
    })

    it('lança erro quando relatório está finalizado', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Relatório finalizado — reabra para editar.'] },
      })

      await expect(
        atualizarSecaoRelatorio(5, { secaoChave: 0, textoEditado: 'X', notasManuais: null })
      ).rejects.toThrow('Relatório finalizado — reabra para editar.')
    })
  })

  describe('finalizarRelatorio', () => {
    it('retorna relatório finalizado', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true, objeto: { id: 5, status: 1, secoes: [] } },
      })

      const result = await finalizarRelatorio(5)

      expect(result.status).toBe(1)
      expect(api.post).toHaveBeenCalledWith('/Relatorio/5/finalizar')
    })

    it('lança erro quando relatório ainda não foi gerado', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Este relatório ainda não foi gerado.'] },
      })

      await expect(finalizarRelatorio(5)).rejects.toThrow('Este relatório ainda não foi gerado.')
    })
  })

  describe('reabrirRelatorio', () => {
    it('retorna relatório em rascunho', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true, objeto: { id: 5, status: 0, secoes: [] } },
      })

      const result = await reabrirRelatorio(5)

      expect(result.status).toBe(0)
      expect(api.post).toHaveBeenCalledWith('/Relatorio/5/reabrir')
    })
  })

  describe('duplicarRelatorio', () => {
    it('retorna o novo relatório duplicado', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true, objeto: { id: 12, alunoId: 5, status: 0, secoes: [] } },
      })

      const result = await duplicarRelatorio(5)

      expect(result.id).toBe(12)
      expect(result.status).toBe(0)
      expect(api.post).toHaveBeenCalledWith('/Relatorio/5/duplicar')
    })

    it('lança erro quando relatório original não encontrado', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Relatório não encontrado.'] },
      })

      await expect(duplicarRelatorio(999)).rejects.toThrow('Relatório não encontrado.')
    })
  })
})
