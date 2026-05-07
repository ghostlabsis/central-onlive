export type Selliver = {
  id: string;
  nome: string;
  whatsapp: string;
  nivel: 'iniciante' | 'intermediaria' | 'pro';
  ativo: boolean;
  horario_live: string;
  nicho: string;
  slug: string;
};

export const SELLIVERS: Selliver[] = [
  {
    id: 'kamille',
    nome: 'Kamille',
    whatsapp: '+5511999999999', // ← Ana atualiza com número real
    nivel: 'iniciante',
    ativo: true,
    horario_live: '19:00-20:30',
    nicho: 'beauty',
    slug: 'kamille',
  },
  {
    id: 'kauane',
    nome: 'Kauane',
    whatsapp: '+5511988888888', // ← Ana atualiza com número real
    nivel: 'iniciante',
    ativo: true,
    horario_live: '12:00-14:30',
    nicho: 'lifestyle',
    slug: 'kauane',
  },
  {
    id: 'kerollen',
    nome: 'Kerollen',
    whatsapp: '+5511977777777', // ← Ana atualiza com número real
    nivel: 'iniciante',
    ativo: true,
    horario_live: '18:00-20:00',
    nicho: 'fashion-beauty',
    slug: 'kerollen',
  },
];

export function getSellivers(onlyActive = true): Selliver[] {
  return onlyActive ? SELLIVERS.filter((s) => s.ativo) : SELLIVERS;
}

export function getSelliverById(id: string): Selliver | undefined {
  return SELLIVERS.find((s) => s.id === id);
}
