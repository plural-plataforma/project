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

export const fetchEstados = async (): Promise<Uf[]> => {
  try {
    const response = await axios.get<Uf[]>(BASE_URL_IBGE_UF, {
      headers: { 'Accept': 'application/json' },
    });
    return response.data;
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
    return response.data;
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