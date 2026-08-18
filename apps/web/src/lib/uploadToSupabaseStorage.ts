const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_ARTIGOS_BUCKET = import.meta.env.VITE_SUPABASE_ARTIGOS_BUCKET || 'artigos'

/**
 * Sobe um arquivo direto pro Storage do Supabase (mesmo projeto do banco) e retorna a URL
 * pública. Segue o mesmo padrão de uploadToImage (CadastroDeAtividade) — fetch puro, sem SDK,
 * a API .NET só guarda a URL resultante.
 */
export async function uploadToSupabaseStorage(file: File): Promise<string | null> {
  if (!file) return null

  const caminho = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_ARTIGOS_BUCKET}/${caminho}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type,
      },
      body: file,
    },
  )

  if (!response.ok) {
    const texto = await response.text().catch(() => '')
    throw new Error(`Falha no upload da imagem (HTTP ${response.status}): ${texto}`)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_ARTIGOS_BUCKET}/${caminho}`
}
