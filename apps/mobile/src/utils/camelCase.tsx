export default function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase() // Garante base em lowercase
    .split(' ') // Divide por espaços
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza primeira letra de cada palavra
    .join(' '); // Junta de volta

}