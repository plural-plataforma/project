import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarAlunos, buscarAlunoPorId, cadastraAluno, atualizaAluno } from './alunoService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('alunoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarAlunos', () => {
    it('retorna lista de objeto quando sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: [{ id: 1, nomeCompleto: 'João' }],
        },
      })

      const result = await buscarAlunos()

      expect(result).toHaveLength(1)
      expect(result[0].nomeCompleto).toBe('João')
    })

    it('retorna listaObjetos quando objeto não é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [{ id: 2, nomeCompleto: 'Maria' }],
        },
      })

      const result = await buscarAlunos()

      expect(result).toHaveLength(1)
      expect(result[0].nomeCompleto).toBe('Maria')
    })

    it('retorna array vazio quando sucesso é false', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false },
      })

      const result = await buscarAlunos()

      expect(result).toEqual([])
    })
  })

  describe('buscarAlunoPorId', () => {
    it('retorna aluno quando encontrado', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: { id: 1, nomeCompleto: 'João' },
        },
      })

      const result = await buscarAlunoPorId(1)

      expect(result.id).toBe(1)
      expect(result.nomeCompleto).toBe('João')
    })

    it('lança erro quando não encontrado', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false },
      })

      await expect(buscarAlunoPorId(999)).rejects.toThrow('Aluno não encontrado')
    })
  })

  describe('cadastraAluno', () => {
    it('retorna aluno quando cadastro é bem-sucedido', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: { id: 1, nomeCompleto: 'Novo' },
        },
      })

      const result = await cadastraAluno({ nomeCompleto: 'Novo' })

      expect(result.id).toBe(1)
      expect(result.nomeCompleto).toBe('Novo')
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Erro de validação'] },
      })

      await expect(cadastraAluno({ nomeCompleto: 'X' })).rejects.toThrow('Erro de validação')
    })
  })

  describe('atualizaAluno', () => {
    it('lança erro quando id não é informado', async () => {
      await expect(atualizaAluno({ nomeCompleto: 'X' })).rejects.toThrow('ID do aluno é obrigatório')
    })

    it('retorna aluno quando atualização é bem-sucedida', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: { id: 1, nomeCompleto: 'Atualizado' },
        },
      })

      const result = await atualizaAluno({ id: 1, nomeCompleto: 'Atualizado' })

      expect(result.nomeCompleto).toBe('Atualizado')
    })
  })
})
