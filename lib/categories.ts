const CATEGORIES: Record<string, string> = {
  eletronicos_beleza: 'Beauty Tech',
  cosmeticos: 'Cosmético',
  skincare: 'Skincare',
  maquiagem: 'Maquiagem',
  cabelos: 'Cabelos',
  perfumaria: 'Perfumaria',
  alimentos: 'Alimento',
  suplementos: 'Suplemento',
  moda: 'Moda',
  calcados: 'Calçados',
  acessorios: 'Acessórios',
  casa_decoracao: 'Casa & Decoração',
  utilidades_domesticas: 'Utilidades Domésticas',
  pet: 'Pet',
  infantil: 'Infantil',
  brinquedos: 'Brinquedos',
  fitness: 'Fitness',
  esportes: 'Esportes',
  saude: 'Saúde',
  higiene_pessoal: 'Higiene Pessoal',
  tecnologia: 'Tecnologia',
  eletronicos: 'Eletrônicos',
  papelaria: 'Papelaria',
  livros: 'Livros',
  automotivo: 'Automotivo',
};

export function categoryLabel(slug: string): string {
  const normalized = slug.toLowerCase().replace(/ /g, '_');
  return CATEGORIES[normalized] ?? slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
