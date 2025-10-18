import { Planejamento, PlanejamentoResponse } from "@src/types/planejamento";
import { api } from '../services/auth';


export const buscarPlanejamento = async(): Promise<Planejamento[]> =>{

    try {
        const response = await api.get<PlanejamentoResponse>('/Planejamento/buscar');

        let planejamentos: Planejamento[] = [];

        if (Array.isArray(response.data.objeto)) {
        planejamentos = response.data.objeto;
      } else if (Array.isArray(response.data.listaObjetos)) {
        planejamentos = response.data.listaObjetos;
      }
       return planejamentos;
    } catch (error) {
        return []
    }
}