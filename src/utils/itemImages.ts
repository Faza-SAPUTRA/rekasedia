type InventoryItemLike = {
  name?: string;
  category_name?: string;
  image_url?: string | null;
};

type VisualPreset = {
  bg: string;
  accent: string;
  icon: string;
};

const presets: Record<string, VisualPreset> = {
  book: { bg: '#EAF0EA', accent: '#6F8F78', icon: 'book' },
  paper: { bg: '#F4EFE4', accent: '#C49A5A', icon: 'paper' },
  projector: { bg: '#E8EEF3', accent: '#55748E', icon: 'projector' },
  cable: { bg: '#EFEAF2', accent: '#78618B', icon: 'cable' },
  ink: { bg: '#E9EDF2', accent: '#3E5266', icon: 'ink' },
  marker: { bg: '#F5EDEA', accent: '#C26850', icon: 'marker' },
  stapler: { bg: '#ECF2EF', accent: '#5E8A7B', icon: 'stapler' },
  sticky: { bg: '#FFF4C7', accent: '#E0B438', icon: 'sticky' },
  stamp: { bg: '#F6E9E2', accent: '#B96A48', icon: 'stamp' },
  mask: { bg: '#E8F4F2', accent: '#52A392', icon: 'mask' },
  speaker: { bg: '#F0ECE6', accent: '#7C6A56', icon: 'speaker' },
  laptop: { bg: '#E9EEF0', accent: '#5F737D', icon: 'laptop' },
  default: { bg: '#EDF1EA', accent: '#7E927D', icon: 'box' },
};

function pickPreset(name = '', category = '') {
  const text = `${name} ${category}`.toLowerCase();

  if (text.includes('buku')) return presets.book;
  if (text.includes('kertas') || text.includes('hvs') || text.includes('a4')) return presets.paper;
  if (text.includes('projector') || text.includes('proyektor')) return presets.projector;
  if (text.includes('hdmi') || text.includes('kabel')) return presets.cable;
  if (text.includes('tinta') || text.includes('toner')) return presets.ink;
  if (text.includes('spidol') || text.includes('marker')) return presets.marker;
  if (text.includes('stapler')) return presets.stapler;
  if (text.includes('sticky')) return presets.sticky;
  if (text.includes('materai')) return presets.stamp;
  if (text.includes('masker')) return presets.mask;
  if (text.includes('speaker') || text.includes('boombox')) return presets.speaker;
  if (text.includes('macbook') || text.includes('laptop')) return presets.laptop;

  return presets.default;
}

function renderIcon(icon: string, accent: string) {
  const dark = '#2F3532';
  const light = '#FFFFFF';

  switch (icon) {
    case 'book':
      return `<rect x="70" y="44" width="84" height="112" rx="10" fill="${accent}"/><rect x="86" y="44" width="68" height="112" rx="10" fill="${dark}" opacity=".18"/><rect x="88" y="66" width="46" height="8" rx="4" fill="${light}" opacity=".72"/><rect x="88" y="84" width="34" height="7" rx="3.5" fill="${light}" opacity=".45"/><path d="M70 55c0-6 5-11 11-11h8v112h-8c-6 0-11-5-11-11V55z" fill="${dark}" opacity=".18"/>`;
    case 'paper':
      return `<path d="M73 42h69l29 30v88H73z" fill="${light}"/><path d="M142 42v31h29" fill="${accent}" opacity=".45"/><rect x="91" y="87" width="57" height="7" rx="3.5" fill="${accent}" opacity=".7"/><rect x="91" y="106" width="67" height="7" rx="3.5" fill="${dark}" opacity=".18"/><rect x="91" y="125" width="45" height="7" rx="3.5" fill="${dark}" opacity=".18"/>`;
    case 'projector':
      return `<rect x="56" y="78" width="124" height="64" rx="13" fill="${dark}"/><circle cx="98" cy="110" r="22" fill="${accent}"/><circle cx="98" cy="110" r="11" fill="${light}" opacity=".7"/><rect x="131" y="96" width="29" height="8" rx="4" fill="${light}" opacity=".55"/><rect x="132" y="117" width="18" height="8" rx="4" fill="${light}" opacity=".35"/><path d="M75 142h82l-8 16H83z" fill="${dark}" opacity=".45"/>`;
    case 'cable':
      return `<path d="M69 83c56-40 86 81 132 28" fill="none" stroke="${dark}" stroke-width="13" stroke-linecap="round"/><rect x="48" y="72" width="47" height="34" rx="8" fill="${accent}"/><rect x="39" y="81" width="16" height="16" rx="3" fill="${dark}"/><rect x="166" y="101" width="47" height="34" rx="8" fill="${accent}"/><rect x="209" y="110" width="16" height="16" rx="3" fill="${dark}"/><rect x="62" y="82" width="19" height="4" rx="2" fill="${light}" opacity=".55"/><rect x="180" y="111" width="19" height="4" rx="2" fill="${light}" opacity=".55"/>`;
    case 'ink':
      return `<rect x="77" y="58" width="82" height="104" rx="13" fill="${dark}"/><rect x="93" y="42" width="50" height="25" rx="7" fill="${accent}"/><rect x="93" y="89" width="50" height="36" rx="7" fill="${light}" opacity=".86"/><path d="M118 84c12 16 20 28 20 41 0 13-9 23-20 23s-20-10-20-23c0-13 8-25 20-41z" fill="${accent}" opacity=".8"/>`;
    case 'marker':
      return `<g transform="rotate(-24 120 105)"><rect x="55" y="86" width="112" height="31" rx="9" fill="${light}"/><rect x="89" y="86" width="55" height="31" fill="${accent}"/><path d="M167 86h22l13 15-13 16h-22z" fill="${dark}"/><rect x="39" y="88" width="23" height="27" rx="5" fill="${dark}" opacity=".55"/></g>`;
    case 'stapler':
      return `<path d="M60 106c24-34 82-49 129-23 7 4 8 14 1 19l-18 13c-30-15-71-8-94 15l-18-13c-4-3-4-8 0-11z" fill="${accent}"/><path d="M55 124h121c10 0 18 8 18 18v6H55z" fill="${dark}"/><rect x="78" y="146" width="82" height="12" rx="6" fill="${dark}" opacity=".35"/>`;
    case 'sticky':
      return `<rect x="68" y="52" width="104" height="104" rx="8" fill="${accent}"/><path d="M139 156c16-4 28-15 33-31v31z" fill="${dark}" opacity=".18"/><rect x="87" y="79" width="56" height="7" rx="3.5" fill="${dark}" opacity=".22"/><rect x="87" y="99" width="69" height="7" rx="3.5" fill="${dark}" opacity=".17"/>`;
    case 'stamp':
      return `<rect x="82" y="51" width="76" height="44" rx="14" fill="${dark}"/><rect x="99" y="88" width="43" height="46" rx="10" fill="${accent}"/><rect x="64" y="128" width="112" height="27" rx="8" fill="${dark}"/><rect x="78" y="138" width="84" height="8" rx="4" fill="${light}" opacity=".5"/>`;
    case 'mask':
      return `<path d="M59 91c37-24 85-24 122 0v42c-35 25-87 25-122 0z" fill="${light}"/><path d="M59 91c37 20 85 20 122 0" fill="none" stroke="${accent}" stroke-width="8"/><path d="M59 116h122" stroke="${accent}" stroke-width="7" opacity=".55"/><path d="M55 99c-27 4-25 37 3 40M183 99c27 4 25 37-3 40" fill="none" stroke="${dark}" stroke-width="8" stroke-linecap="round" opacity=".35"/>`;
    case 'speaker':
      return `<rect x="72" y="43" width="96" height="122" rx="23" fill="${dark}"/><circle cx="120" cy="123" r="28" fill="${accent}"/><circle cx="120" cy="123" r="12" fill="${light}" opacity=".55"/><circle cx="120" cy="76" r="15" fill="${light}" opacity=".35"/><rect x="103" y="50" width="34" height="5" rx="2.5" fill="${light}" opacity=".28"/>`;
    case 'laptop':
      return `<rect x="66" y="57" width="108" height="73" rx="9" fill="${dark}"/><rect x="78" y="68" width="84" height="51" rx="4" fill="${accent}"/><path d="M49 140h142l-13 18H62z" fill="${dark}"/><rect x="105" y="145" width="31" height="5" rx="2.5" fill="${light}" opacity=".32"/>`;
    default:
      return `<path d="M120 43l62 33v68l-62 33-62-33V76z" fill="${accent}"/><path d="M58 76l62 33 62-33M120 109v68" fill="none" stroke="${dark}" stroke-width="8" opacity=".22"/><path d="M88 60l62 33" stroke="${light}" stroke-width="8" opacity=".45"/>`;
  }
}

export function getItemImage(item: InventoryItemLike) {
  if (item.image_url) return item.image_url;

  const preset = pickPreset(item.name, item.category_name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" role="img" aria-label="${item.name || 'Barang inventaris'}"><rect width="240" height="200" rx="22" fill="${preset.bg}"/><circle cx="195" cy="37" r="24" fill="${preset.accent}" opacity=".12"/><circle cx="43" cy="162" r="31" fill="${preset.accent}" opacity=".14"/>${renderIcon(preset.icon, preset.accent)}</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
