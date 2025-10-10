import axios from 'axios';

const BASE_URL = 'https://brasilapi.com.br/api/cep/v2';

interface CepError {
  name: string;
  message: string;
  type: string;
  errors?: { message: string; service: string }[];
}

interface CepData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  location: {
    type: string;
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
}

const validateCep = (cep: string): string | null => {
  const cepClean = cep.replace(/[^0-9]/g, '');
  if (cepClean.length !== 8) {
    return 'CEP deve conter exatamente 8 caracteres.';
  }
  return null;
};

export const fetchCepData = async (cep: string): Promise<CepData> => {
  const error = validateCep(cep);
  if (error) {
    throw {
      name: 'CepPromiseError',
      message: error,
      type: 'validation_error',
      errors: [{ message: `CEP informado possui ${cep.length} caracteres.`, service: 'cep_validation' }],
    };
  }

  try {
    const response = await axios.get(`${BASE_URL}/${cep}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.status === 200) {
      return response.data as CepData;
    } else {
      throw {
        name: 'UnexpectedResponseError',
        message: `Unexpected status code: ${response.status}`,
        type: 'api_error',
      };
    }
  } catch (error: any) {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          throw {
            name: 'BadRequestError',
            message: data.message || 'CEP deve conter exatamente 8 dígitos',
            type: 'validation_error',
          };
        case 404:
          throw {
            name: 'NotFoundError',
            message: data.message || 'CEP não encontrado',
            type: 'service_error',
          };
        case 500:
          throw {
            name: 'InternalError',
            message: data.message || 'Erro interno no serviço de CEP',
            type: 'internal_error',
          };
        default:
          throw {
            name: 'CepPromiseError',
            message: 'Erro ao buscar CEP.',
            type: 'api_error',
            errors: [{ message: error.message, service: 'brasilapi' }],
          };
      }
    } else {
      throw {
        name: 'CepPromiseError',
        message: 'Erro ao conectar ao serviço de CEP.',
        type: 'api_error',
        errors: [{ message: error.message, service: 'brasilapi' }],
      };
    }
  }
};
export default validateCep;