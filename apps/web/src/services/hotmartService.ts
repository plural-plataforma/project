// src/services/hotmartService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://dev-api.runasp.net/api';

const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export interface HotmartSale {
    transaction: string;
    buyerName: string;
    buyerEmail?: string;
    jaCadastradoComoProfessor?: boolean;
    professorId: number;
    nivelEnsino: string;
    ativo: boolean;
    roles: string[];
    telefone: number;
    perfil: string;
    isEmbaixadora: boolean;
    // Adicione outros campos que a API retorna, se souber
}

interface FetchParams {
    productId?: number | string;
    from?: string;          // formato: DD/MM/YYYY
    to?: string;            // formato: DD/MM/YYYY
    transactionStatus?: string;  // ex: 'APPROVED', ' ' (espaço para todos?), etc.
}

export const fetchHotmartSales = async (params: FetchParams = {}): Promise<HotmartSale[]> => {
    const token = getAuthToken();

    if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    try {
        // Monta query params
        const queryParams = new URLSearchParams();

        if (params.productId) {
            queryParams.append('productId', params.productId.toString());
        } else {
            queryParams.append('productId', '6420317'); // fallback fixo
        }
        if (params.from) {
            queryParams.append('from', params.from);
        }
        if (params.to) {
            queryParams.append('to', params.to);
        }
        if (params.transactionStatus !== undefined) {
            queryParams.append('transactionStatus', params.transactionStatus);
        }

        const response = await axios.get<{ data: HotmartSale[] }>(
            `${API_URL}/vendas/hotmart?${queryParams.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: '*/*',
                },
            }
        );

        return response.data.data || []; // Ajuste conforme a estrutura real (response.data.data)
    } catch (error) {
        console.error('Erro ao buscar vendas Hotmart:', error);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || 'Falha ao carregar vendas da Hotmart.');
        }
        throw error;
    }
};