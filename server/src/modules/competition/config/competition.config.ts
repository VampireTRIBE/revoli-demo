import type { CompetitionConfig } from '../types/competition.types.js';

export const COMPETITION_SOURCE_LABEL = 'Source: Meta Ad Library. Activity, not spend.' as const;

const editFormatGroups: Record<string, string> = {
  image: 'Image',
  'image (product tile)': 'Image',
  'catalog / carousel': 'Catalog / carousel',
};

export const competitionConfigs: CompetitionConfig[] = [
  {
    id: 'edit-by-ahmed-seddiqi',
    clientId: 'rivoli-shop',
    clientLabel: 'Rivoli Shop',
    label: 'EDIT by Ahmed Seddiqi',
    metaPage: 'Byedit',
    website: 'https://byedit.com',
    workbookPattern: /^Competition-Capture-EDIT-Byedit-.*\.xlsx$/i,
    formatGroups: editFormatGroups,
    themePrefixes: [
      { prefix: 'Catalog', group: 'Catalog' },
      { prefix: 'Offer code', group: 'Offer code' },
      { prefix: 'Product spotlight', group: 'Product spotlight' },
      { prefix: 'Gifting', group: 'Gifting' },
    ],
  },
  {
    id: 'carrefour-uae',
    clientId: 'union-coop',
    clientLabel: 'Union Coop',
    label: 'Carrefour UAE',
    metaPage: 'Carrefour UAE',
    website: null,
    workbookPattern: /^Competition-Capture-UnionCoop-Carrefour-LuLu-.*\.xlsx$/i,
    formatGroups: {},
    themePrefixes: [],
    comparisonLabel: 'Their paid ads vs our organic posts.',
  },
  {
    id: 'lulu-hypermarket',
    clientId: 'union-coop',
    clientLabel: 'Union Coop',
    label: 'LuLu Hypermarket',
    metaPage: 'LuLu Hypermarket',
    website: null,
    workbookPattern: /^Competition-Capture-UnionCoop-Carrefour-LuLu-.*\.xlsx$/i,
    formatGroups: {},
    themePrefixes: [],
    comparisonLabel: 'Their paid ads vs our organic posts.',
  },
];

export function findCompetitionConfig(value: string): CompetitionConfig | undefined {
  const normalized = value.trim().toLowerCase();
  return competitionConfigs.find((config) => [config.id, config.label, config.metaPage].some((item) => item.toLowerCase() === normalized));
}

export function groupCompetitionFormat(config: CompetitionConfig, raw: string): string {
  return config.formatGroups[raw.trim().toLowerCase()] ?? raw.trim();
}

export function groupCompetitionTheme(config: CompetitionConfig, raw: string | null): string | null {
  if (!raw) return null;
  return config.themePrefixes.find(({ prefix }) => raw.toLowerCase().startsWith(prefix.toLowerCase()))?.group ?? raw;
}
