#!/usr/bin/env node
/**
 * Gera `src/presentation/components/Icon/icons.generated.ts` a partir dos SVGs do Stara UI Kit
 * (`assets/icons/stara/<tamanho>/`) e dos provisórios (`assets/icons/stara/custom/`).
 *
 * Uso: `npm run icons`. Para trocar ou adicionar um ícone, edite o mapa `ICON_MAP` abaixo
 * (nome usado no app → arquivo do kit) e rode o script de novo. Nunca edite o arquivo gerado.
 *
 * O que o script faz em cada SVG:
 * - troca a cor fixa do kit (#2C2C2D) por `currentColor`, para o ícone herdar a cor do tema;
 * - remove `width`/`height` (o tamanho vem da prop `size`) e o `clip-path` de moldura do Figma;
 * - falha se sobrar alguma outra cor fixa, para nenhum ícone ignorar o tema.
 */
/* global __dirname */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KIT = path.join(ROOT, 'assets/icons/stara');
const OUT = path.join(ROOT, 'src/presentation/components/Icon/icons.generated.ts');

/**
 * Nome no app → arquivos do kit. `24` é obrigatório; `16` é a versão desenhada para tamanhos
 * pequenos (o `Icon` usa quando `size <= 18`). Caminho relativo a `assets/icons/stara`.
 */
const ICON_MAP = {
  add: { 24: '24/plus_24', 16: '16/plus_16' },
  arrowRight: { 24: '24/arrow_right_24' },
  attach: { 24: 'custom/attach_24' },
  bell: { 24: '24/notification_24' },
  calendar: { 24: '24/calendar_24', 16: '16/calendar_16' },
  camera: { 24: 'custom/camera_24' },
  // Categorias de despesa (provisórios: o kit não tem estes desenhos).
  categoryFuel: { 24: 'custom/category_fuel_24' },
  categoryLodging: { 24: 'custom/category_lodging_24' },
  categoryMeal: { 24: 'custom/category_meal_24' },
  categoryOther: { 24: 'custom/category_other_24' },
  categoryParking: { 24: 'custom/category_parking_24' },
  categorySupplies: { 24: 'custom/category_supplies_24' },
  categoryToll: { 24: 'custom/category_toll_24' },
  categoryTransport: { 24: 'custom/category_transport_24' },
  check: { 24: '24/check_24', 16: '16/status_success_16' },
  chevronDown: { 24: '24/chevron_down_24', 16: '16/chevron_down_16' },
  chevronLeft: { 24: '24/chevron_left_24', 16: '16/chevron_left_16' },
  chevronRight: { 24: '24/chevron_right_24', 16: '16/chevron_right_16' },
  close: { 24: '24/cancel_small_24', 16: '16/cancel_16' },
  delete: { 24: '24/delete_24', 16: '16/delete_16' },
  edit: { 24: '24/edit_24', 16: '16/edit_16' },
  flashOff: { 24: 'custom/flash_off_24' },
  flashOn: { 24: '24/tension_24' },
  folder: { 24: '24/archive_24', 16: '16/folder_16' },
  gallery: { 24: '24/ic_image_24' },
  history: { 24: '24/time_clock_24', 16: '16/history_16' },
  home: { 24: '24/home_24' },
  image: { 24: '24/ic_image_24' },
  lock: { 24: '24/locked_24', 16: '16/locked_16' },
  logout: { 24: '24/logout_24', 16: '16/logout_16' },
  manual: { 24: '24/file_plus_24' },
  multiple: { 24: '24/layers_24' },
  offline: { 24: 'custom/offline_24' },
  openExternal: { 24: '24/go_to_24' },
  paste: { 24: '24/copy_24' },
  // Formas de pagamento (provisórios: o kit não tem estes desenhos).
  paymentCash: { 24: 'custom/payment_cash_24' },
  paymentCorporateCard: { 24: 'custom/payment_corporate_card_24' },
  paymentCreditCard: { 24: 'custom/payment_credit_card_24' },
  paymentDebitCard: { 24: 'custom/payment_debit_card_24' },
  paymentOther: { 24: 'custom/payment_other_24' },
  paymentPix: { 24: 'custom/payment_pix_24' },
  pdf: { 24: '24/pdf_24' },
  person: { 24: '24/user_24', 16: '16/user_16' },
  receipt: { 24: '24/file_24', 16: '16/feed_16' },
  report: { 24: '24/reports_24' },
  scan: { 24: '24/scan_code' },
  send: { 24: 'custom/send_24' },
  sparkles: { 24: 'custom/sparkles_24' },
  sync: { 24: '24/update_24', 16: '16/synchronize_16' },
  undo: { 24: '24/reverse_24', 16: '16/reverse_16' },
  warning: { 24: '24/alarm_24', 16: '16/status_16' },
};

const KIT_COLOR = /#2c2c2d/gi;

function clean(file) {
  let svg = fs.readFileSync(path.join(KIT, `${file}.svg`), 'utf8');
  svg = svg
    .replace(KIT_COLOR, 'currentColor')
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/\s*clip-path="[^"]*"/g, '')
    .replace(/<svg([^>]*?)\s+width="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*?)\s+height="[^"]*"/, '<svg$1')
    .replace(/\s*\n\s*/g, '')
    .trim();
  const stray = svg.match(/(?:fill|stroke)="(?!none|currentColor)[^"]+"/);
  if (stray) throw new Error(`${file}.svg tem cor fixa (${stray[0]}); use #2C2C2D ou none.`);
  if (!/viewBox="0 0 (16|24) (16|24)"/.test(svg)) throw new Error(`${file}.svg: viewBox inesperado.`);
  return svg;
}

const entries = Object.entries(ICON_MAP)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, sizes]) => {
    const variants = Object.entries(sizes)
      .map(([size, file]) => `    ${size}: ${JSON.stringify(clean(file))},`)
      .join('\n');
    return `  ${name}: {\n${variants}\n  },`;
  });

const header = `
// ARQUIVO GERADO por \`scripts/generate-icons.js\` (\`npm run icons\`). Não edite à mão.
// Fonte: Stara UI Kit (assets/icons/stara). Cor: currentColor (vem da prop \`color\` do Icon).
`;

fs.writeFileSync(
  OUT,
  `${header}\nexport const ICON_SVGS = {\n${entries.join('\n')}\n} as const satisfies Record<string, { 24: string; 16?: string }>;\n`,
);
console.log(`icons: ${entries.length} ícones gerados em ${path.relative(ROOT, OUT)}`);
