import axios from 'axios';

const BASE_URL_IBGE_UF = 'https://brasilapi.com.br/api/ibge/uf/v1';
const BASE_URL_IBGE_MUNICIPIOS = 'https://brasilapi.com.br/api/ibge/municipios/v1';

interface Uf {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

interface Municipio {
  nome: string;
  codigo_ibge: string;
}

// NOVO: Função toTitleCase para capitalizar nomes de municípios
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase() // Garante base em lowercase
    .split(' ') // Divide por espaços
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza primeira letra de cada palavra
    .join(' '); // Junta de volta
}

export const fetchEstados = async (): Promise<Uf[]> => {
  try {
    const response = await axios.get<Uf[]>(BASE_URL_IBGE_UF, {
      headers: { 'Accept': 'application/json' },
    });
    // NOVO: Ordena os estados por nome em ordem alfabética
    return response.data.sort((a, b) => a.nome.localeCompare(b.nome));
  } catch (error: any) {
    console.error('Erro ao buscar estados:', error.message);
    throw {
      name: 'FetchEstadosError',
      message: 'Erro ao carregar estados.',
      type: 'api_error',
    };
  }
};

export const fetchMunicipios = async (uf: string): Promise<Municipio[]> => {
  try {
    const response = await axios.get<Municipio[]>(`${BASE_URL_IBGE_MUNICIPIOS}/${uf}`, {
      headers: { 'Accept': 'application/json' },
    });
    // NOVO: Ordena os municípios por nome em ordem alfabética e aplica toTitleCase no nome
    return response.data
      .map(municipio => ({
        ...municipio,
        nome: toTitleCase(municipio.nome) // Aplica title case ao nome
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  } catch (error: any) {
    console.error('Erro ao buscar municípios para UF', uf, ':', error.message);
    throw {
      name: 'FetchMunicipiosError',
      message: `Erro ao carregar municípios para ${uf}.`,
      type: 'api_error',
    };
  }
};

export default {fetchMunicipios, fetchEstados};