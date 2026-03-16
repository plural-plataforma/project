import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buscarProfessor,
  buscarEscolasProfessor,
  atualizarProfessor,
  vincularEscola,
  desvincularEscola,
  isCadastroCompleto,
  getCadastroPendencias,
} from './professorService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

describe('professorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarProfessor', () => {
    it('retorna dados do professor', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { objeto: { nomeCompleto: 'Prof João' } },
      })

      const result = await buscarProfessor()

      expect(result.objeto?.nomeCompleto).toBe('Prof João')
    })

    it('lança erro quando resposta é vazia', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: null })

      await expect(buscarProfessor()).rejects.toThrow('Resposta vazia da API')
    })
  })

  describe('buscarEscolasProfessor', () => {
    it('retorna lista de escolas', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          objeto: [{ id: 1, nomeInstituicao: 'Escola A' }],
        },
      })

      const result = await buscarEscolasProfessor()

      expect(result).toHaveLength(1)
      expect(result[0].nomeInstituicao).toBe('Escola A')
    })

    it('lança erro quando formato é inválido', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { objeto: { nome: 'não é array' } },
      })

      await expect(buscarEscolasProfessor()).rejects.toThrow('Formato inválido da API')
    })
  })

  describe('atualizarProfessor', () => {
    it('envia payload com escolas vazias para evitar conflito', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: { sucesso: true, objeto: { id: 1 } },
      })

      await atualizarProfessor({
        id: 1,
        nomeCompleto: 'João',
        sexo: 'M',
        cep: '12345',
        estado: 'SP',
        telefone: '11999999999',
        escolas: [{ id: 1 }],
      } as any)

      expect(api.patch).toHaveBeenCalledWith(
        '/Professor/atualizar/',
        expect.objectContaining({ escolas: [] })
      )
    })
  })

  describe('vincularEscola', () => {
    it('não lança erro quando escola já está vinculada', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['já está vinculado'] },
      })

      const result = await vincularEscola(1)

      expect(result.sucesso).toBe(false)
    })

    it('lança erro quando falha e não é "já vinculado"', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Erro de permissão'] },
      })

      await expect(vincularEscola(1)).rejects.toThrow('Erro de permissão')
    })
  })

  describe('desvincularEscola', () => {
    it('não lança erro quando escola não está vinculada', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['não está vinculado'] },
      })

      const result = await desvincularEscola(1)

      expect(result.sucesso).toBe(false)
    })

    it('lança erro quando falha e não é "não vinculado"', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Erro de permissão'] },
      })

      await expect(desvincularEscola(1)).rejects.toThrow('Erro de permissão')
    })
  })

  describe('isCadastroCompleto', () => {
    it('retorna true quando todos os campos obrigatórios estão preenchidos', () => {
      const professor = {
        nomeCompleto: 'João',
        sexo: 'M',
        cep: '12345',
        estado: 'SP',
        telefone: '11999999999',
      }
      expect(isCadastroCompleto(professor as any, 1)).toBe(true)
    })

    it('retorna false quando falta algum campo', () => {
      expect(isCadastroCompleto({ nomeCompleto: 'João' } as any, 1)).toBe(false)
      expect(isCadastroCompleto({ nomeCompleto: 'João', sexo: 'M', cep: '1', estado: 'SP', telefone: '9' } as any, 0)).toBe(false)
    })
  })

  describe('getCadastroPendencias', () => {
    it('retorna pendências faltantes com labels amigáveis', () => {
      const pendencias = getCadastroPendencias({ nomeCompleto: 'João' } as any, 0)
      expect(pendencias.map((p) => p.key)).toEqual([
        'sexo',
        'cep',
        'estado',
        'telefone',
        'escola',
      ])
    })

    it('retorna vazio quando cadastro está completo', () => {
      const pendencias = getCadastroPendencias(
        {
          nomeCompleto: 'João',
          sexo: 'M',
          cep: '12345',
          estado: 'SP',
          telefone: '11999999999',
        } as any,
        2
      )
      expect(pendencias).toEqual([])
    })
  })
})
