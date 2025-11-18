// @src/utils/locationUtils.ts
import { Uf, Municipio } from "@src/services/locationsService";

/**
 * Normaliza string: remove acentos e converte para lowercase
 */
export const normalizeString = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

/**
 * Ordena UFs por nome (alfabético, pt-BR)
 */
export const sortUfs = (ufs: Uf[]): Uf[] => {
  return [...ufs].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
};

/**
 * Ordena municípios por nome
 */
export const sortCidades = (cidades: Municipio[]): Municipio[] => {
  return [...cidades].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
};

/**
 * Formata UFs para dropdown: { label, value }
 */
export const formatUfsDropdown = (ufs: Uf[]): { label: string; value: string }[] => {
  return sortUfs(ufs).map(uf => ({
    label: uf.nome,
    value: uf.sigla,
  }));
};

/**
 * Formata cidades como string[] ordenadas
 */
export const formatCidadesList = (municipios: Municipio[]): string[] => {
  return sortCidades(municipios).map(m => m.nome);
};

/**
 * Encontra cidade exata (case/acento insensitive)
 */
export const findCidadeMatch = (nomeCidade: string, cidadesList: string[]): string | null => {
  if (!nomeCidade || !cidadesList.length) return null;
  const normalized = normalizeString(nomeCidade);
  return cidadesList.find(c => normalizeString(c) === normalized) || null;
};

/**
 * Converte nome do estado → sigla (sem precisar da lista de UFs!)
 * Usa mapa estático interno – 100% confiável e offline
 */
export const getSiglaFromNome = (nomeEstado: string): string => {
  if (!nomeEstado) return "";

  const normalized = normalizeString(nomeEstado);

  const mapaEstados: Record<string, string> = {
    acre: "AC",
    alagoas: "AL",
    amapa: "AP",
    amazonas: "AM",
    bahia: "BA",
    ceara: "CE",
    "distrito federal": "DF",
    "espirito santo": "ES",
    goias: "GO",
    maranhao: "MA",
    "mato grosso": "MT",
    "mato grosso do sul": "MS",
    "minas gerais": "MG",
    para: "PA",
    paraiba: "PB",
    parana: "PR",
    pernambuco: "PE",
    piaui: "PI",
    "rio de janeiro": "RJ",
    "rio grande do norte": "RN",
    "rio grande do sul": "RS",
    rondonia: "RO",
    roraima: "RR",
    "santa catarina": "SC",
    "sao paulo": "SP",
    sergipe: "SE",
    tocantins: "TO",
  };

  return mapaEstados[normalized] || "";
};