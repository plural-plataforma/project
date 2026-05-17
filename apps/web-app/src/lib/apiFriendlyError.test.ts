import { describe, it, expect } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  buildFriendlyApiFeedback,
  formatFriendlyErrorBody,
  getApiErrorFeedback,
  getApiErrorMessageForUser,
} from './apiFriendlyError'

function axiosCfg(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return {
    url: '/api/Autenticacao/login',
    method: 'post',
    ...overrides,
  } as InternalAxiosRequestConfig
}

describe('apiFriendlyError', () => {
  it('trata payload HTML longo como erro genérico sem repassar markup', () => {
    const html = `<!DOCTYPE html><html><body>Npgsql.PostgresException</body></html>`
    const config = axiosCfg()
    const err = new AxiosError('fail', 'ERR_BAD_RESPONSE', config, {}, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'content-type': 'text/html; charset=utf-8' },
      data: html,
      config,
    })

    const fb = buildFriendlyApiFeedback(err)
    expect(fb.title).toContain('Serviço')
    expect(fb.description).not.toMatch(/Npgsql/)
    expect(fb.description).not.toMatch(/<!DOCTYPE/i)
    expect(fb.supportHint).toMatch(/^HTTP 500/)
  })

  it('não expõe texto técnico tipo stack trace em string', () => {
    const raw =
      'Npgsql.PostgresException (0x80004005): XX000: tenant not found at Npgsql.Internal.NpgsqlConnector.Open'
    const config = axiosCfg()
    const err = new AxiosError('fail', 'ERR_BAD_RESPONSE', config, {}, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'content-type': 'text/plain' },
      data: raw,
      config,
    })

    const fb = buildFriendlyApiFeedback(err)
    expect(fb.description).not.toMatch(/Npgsql/)
    expect(fb.supportHint).toMatch(/^HTTP 500/)
  })

  it('preserva mensagem curta e não técnica em JSON', () => {
    const config = axiosCfg({ url: '/api/foo' })
    const err = new AxiosError('fail', 'ERR_BAD_REQUEST', config, {}, {
      status: 400,
      statusText: 'Bad Request',
      headers: { 'content-type': 'application/json' },
      data: { message: 'Preencha todos os campos obrigatórios.' },
      config,
    })

    const fb = buildFriendlyApiFeedback(err)
    expect(fb.description).toBe('Preencha todos os campos obrigatórios.')
  })

  it('concatena mensagens[] quando são strings seguras', () => {
    const config = axiosCfg()
    const err = new AxiosError('fail', 'ERR_BAD_REQUEST', config, {}, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'content-type': 'application/json' },
      data: { mensagens: ['E-mail já cadastrado no sistema.'] },
      config,
    })

    const fb = buildFriendlyApiFeedback(err)
    expect(fb.description).toContain('E-mail já cadastrado')
  })

  it('getApiErrorFeedback sanitiza Error com mensagem técnica', () => {
    const fb = getApiErrorFeedback(new Error('Npgsql.PostgresException: boom'))
    expect(fb.description).not.toMatch(/Npgsql/)
  })

  it('formatFriendlyErrorBody inclui linha de suporte quando há supportHint', () => {
    const body = formatFriendlyErrorBody({
      title: 'X',
      description: 'Descrição para a usuária.',
      supportHint: 'HTTP 500 · POST /login · ts',
    })
    expect(body).toContain('Informe ao suporte:')
    expect(body).toContain('HTTP 500')
  })
})
