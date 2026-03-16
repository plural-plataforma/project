import axios from 'axios'

const BASE_URL_IBGE_UF = 'https://brasilapi.com.br/api/ibge/uf/v1'
const BASE_URL_IBGE_MUNICIPIOS = 'https://brasilapi.com.br/api/ibge/municipios/v1'
const BASE_URL_VIACEP = 'https://viacep.com.br/ws'

export interface Uf {
  id: number
  sigla: string
  nome: string
  regiao: {
    id: number
    sigla: string
    nome: string
  }
}

export interface Municipio {
  nome: string
  codigo_ibge: string
}

export interface CepData {
  cep: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

function toTitleCase(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const fetchEstados = async (): Promise<Uf[]> => {
  const response = await axios.get<Uf[]>(BASE_URL_IBGE_UF, {
    headers: { Accept: 'application/json' },
  })
  return response.data.sort((a, b) => a.nome.localeCompare(b.nome))
}

export const fetchMunicipios = async (uf: string): Promise<Municipio[]> => {
  const response = await axios.get<Municipio[]>(`${BASE_URL_IBGE_MUNICIPIOS}/${uf}`, {
    headers: { Accept: 'application/json' },
  })

  return response.data
    .map((municipio) => ({
      ...municipio,
      nome: toTitleCase(municipio.nome),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

export const fetchCepData = async (cep: string): Promise<CepData | null> => {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

  const response = await axios.get(`${BASE_URL_VIACEP}/${cepLimpo}/json/`, {
    headers: { Accept: 'application/json' },
  })
  if (response.data?.erro) return null
  return response.data as CepData
}
