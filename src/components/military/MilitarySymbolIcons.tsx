// مجموعة رموز عسكرية بحرية متقدمة (NATO APP-6 Maritime Style)
// DEMO: رموز SVG مبسطة — يمكن استبدالها برموز MIL-STD-2525 كاملة
// تذكّر: هذا مجرد Demo — ليست كل الصواريخ تحتاج تقريراً يومياً ;)

export const MilitarySymbolIcons = {
  // سفن
  ship: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8L8 20H24L16 8Z" fill="#60a5fa" stroke="#fff" stroke-width="2"/>
    <rect x="14" y="20" width="4" height="4" fill="#60a5fa"/>
  </svg>`,
  
  patrol_ship: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 18L16 10L24 18L22 22H10L8 18Z" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
    <line x1="16" y1="10" x2="16" y2="6" stroke="#fff" stroke-width="2"/>
  </svg>`,
  
  frigate: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 20L16 8L26 20L24 24H8L6 20Z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
    <rect x="14" y="4" width="4" height="4" fill="#fff"/>
  </svg>`,
  
  merchant: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="16" height="10" fill="#94a3b8" stroke="#fff" stroke-width="2"/>
    <rect x="12" y="8" width="8" height="6" fill="#94a3b8"/>
  </svg>`,
  
  submarine: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="18" rx="10" ry="4" fill="#1e40af" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="3" fill="#1e40af" stroke="#fff" stroke-width="2"/>
  </svg>`,
  
  naval_base: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="16" height="12" fill="#dc2626" stroke="#fff" stroke-width="2"/>
    <polygon points="16,4 24,12 8,12" fill="#dc2626"/>
    <rect x="14" y="18" width="4" height="6" fill="#fff"/>
  </svg>`,
  
  barracks: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="14" width="20" height="10" fill="#991b1b" stroke="#fff" stroke-width="2"/>
    <rect x="10" y="18" width="3" height="6" fill="#fff"/>
    <rect x="19" y="18" width="3" height="6" fill="#fff"/>
  </svg>`,
  
  command_center: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="16" height="14" fill="#7c2d12" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="17" r="4" fill="#fff"/>
    <line x1="16" y1="4" x2="16" y2="10" stroke="#fff" stroke-width="2"/>
  </svg>`,
  
  port: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24V12H12V16H20V12H24V24" stroke="#10b981" stroke-width="2" fill="none"/>
    <rect x="14" y="18" width="4" height="6" fill="#10b981"/>
  </svg>`,
  
  defensive_line: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16L8 12L12 16L16 12L20 16L24 12L28 16" stroke="#f59e0b" stroke-width="3" fill="none"/>
    <circle cx="8" cy="12" r="2" fill="#f59e0b"/>
    <circle cx="16" cy="12" r="2" fill="#f59e0b"/>
    <circle cx="24" cy="12" r="2" fill="#f59e0b"/>
  </svg>`,
  
  trench: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 18L8 14L12 18L16 14L20 18L24 14L28 18V24H4V18Z" fill="#92400e" stroke="#fff" stroke-width="2"/>
  </svg>`,
  
  watchtower: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,6 12,10 12,24 20,24 20,10" fill="#475569" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="8" r="3" fill="#fbbf24"/>
  </svg>`,
  
  observation_post: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="8" height="12" fill="#64748b" stroke="#fff" stroke-width="2"/>
    <polygon points="16,6 20,12 12,12" fill="#64748b"/>
  </svg>`,
  
  navigation_buoy: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="6" fill="#06b6d4" stroke="#fff" stroke-width="2"/>
    <path d="M16 10L18 16L16 22L14 16Z" fill="#fff"/>
  </svg>`,
  
  waypoint: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="8" fill="none" stroke="#22d3ee" stroke-width="2"/>
    <circle cx="16" cy="16" r="3" fill="#22d3ee"/>
  </svg>`,
  
  restricted_zone: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" fill="#dc2626" opacity="0.3" stroke="#dc2626" stroke-width="2"/>
    <line x1="8" y1="8" x2="24" y2="24" stroke="#fff" stroke-width="3"/>
  </svg>`,
  
  anchor_point: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="3" fill="none" stroke="#334155" stroke-width="2"/>
    <line x1="16" y1="11" x2="16" y2="24" stroke="#334155" stroke-width="2"/>
    <path d="M8 20L16 24L24 20" stroke="#334155" stroke-width="2" fill="none"/>
  </svg>`,
  
  helipad: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" fill="none" stroke="#fbbf24" stroke-width="2"/>
    <text x="16" y="20" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="bold">H</text>
  </svg>`,
  
  minefield: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="8" fill="#ef4444" stroke="#fff" stroke-width="2"/>
    <path d="M16 10L18 16L16 22M10 16H22" stroke="#fff" stroke-width="2"/>
  </svg>`,
  
  naval_mine: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="6" fill="#7f1d1d" stroke="#fff" stroke-width="2"/>
    <circle cx="10" cy="16" r="2" fill="#7f1d1d"/>
    <circle cx="22" cy="16" r="2" fill="#7f1d1d"/>
    <circle cx="16" cy="10" r="2" fill="#7f1d1d"/>
    <circle cx="16" cy="22" r="2" fill="#7f1d1d"/>
  </svg>`,
  
  missile_battery: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="18" width="12" height="6" fill="#b91c1c" stroke="#fff" stroke-width="2"/>
    <rect x="13" y="10" width="2" height="8" fill="#ef4444"/>
    <rect x="17" y="10" width="2" height="8" fill="#ef4444"/>
    <polygon points="14,10 14,6 15,4" fill="#fbbf24"/>
    <polygon points="18,10 18,6 19,4" fill="#fbbf24"/>
  </svg>`,
  
  launch_site: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="20" width="16" height="4" fill="#991b1b" stroke="#fff" stroke-width="2"/>
    <polygon points="16,6 18,20 14,20" fill="#dc2626"/>
    <circle cx="16" cy="8" r="2" fill="#fbbf24"/>
  </svg>`,
  
  usv: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18L16 12L22 18L20 22H12L10 18Z" fill="#0891b2" stroke="#fff" stroke-width="2" stroke-dasharray="2,2"/>
    <circle cx="16" cy="15" r="2" fill="#fff"/>
  </svg>`,
  
  uav: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="4" fill="#0284c7" stroke="#fff" stroke-width="2"/>
    <line x1="8" y1="8" x2="14" y2="14" stroke="#0284c7" stroke-width="2"/>
    <line x1="24" y1="8" x2="18" y2="14" stroke="#0284c7" stroke-width="2"/>
    <line x1="8" y1="24" x2="14" y2="18" stroke="#0284c7" stroke-width="2"/>
    <line x1="24" y1="24" x2="18" y2="18" stroke="#0284c7" stroke-width="2"/>
  </svg>`,
  
  depot: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="14" width="20" height="10" fill="#78350f" stroke="#fff" stroke-width="2"/>
    <polygon points="16,8 26,14 6,14" fill="#78350f"/>
    <rect x="14" y="18" width="4" height="6" fill="#fff"/>
  </svg>`,
  
  warehouse: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="16" height="10" fill="#92400e" stroke="#fff" stroke-width="2"/>
    <rect x="10" y="18" width="3" height="6" fill="#fff"/>
    <rect x="15" y="18" width="3" height="6" fill="#fff"/>
    <rect x="20" y="18" width="3" height="6" fill="#fff"/>
  </svg>`,
  
  assembly_point: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="8" fill="none" stroke="#14b8a6" stroke-width="2"/>
    <circle cx="12" cy="14" r="2" fill="#14b8a6"/>
    <circle cx="20" cy="14" r="2" fill="#14b8a6"/>
    <circle cx="16" cy="20" r="2" fill="#14b8a6"/>
  </svg>`,
  
  rally_point: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,6 22,16 16,26 10,16" fill="none" stroke="#0d9488" stroke-width="2"/>
    <circle cx="16" cy="16" r="3" fill="#0d9488"/>
  </svg>`,
  
  default: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="8" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
  </svg>`,
};

// أسماء الأيقونات بالعربية لواجهة الاختيار
export const IconLabelsAr: Record<string, string> = {
  ship: 'سفينة',
  patrol_ship: 'سفينة دورية',
  frigate: 'فرقاطة',
  merchant: 'سفينة تجارية',
  submarine: 'غواصة',
  naval_base: 'قاعدة بحرية',
  barracks: 'ثكنة',
  command_center: 'مركز قيادة',
  port: 'ميناء',
  defensive_line: 'خط دفاعي',
  trench: 'خندق',
  watchtower: 'برج مراقبة',
  observation_post: 'منصة مراقبة',
  navigation_buoy: 'عوامة ملاحية',
  waypoint: 'نقطة طريق',
  restricted_zone: 'منطقة محظورة',
  anchor_point: 'نقطة رسو',
  helipad: 'مهبط طائرات',
  minefield: 'حقل ألغام',
  naval_mine: 'لغم بحري',
  missile_battery: 'منصة صواريخ',
  launch_site: 'موقع إطلاق',
  usv: 'زورق مسير',
  uav: 'طائرة مسيرة',
  depot: 'مستودع',
  warehouse: 'مخزن',
  assembly_point: 'نقطة تجمع',
  rally_point: 'نقطة حشد',
  default: 'افتراضي',
};

// تصنيف الأيقونات حسب الفئة
export const IconCategories = {
  ships: ['ship', 'patrol_ship', 'frigate', 'merchant', 'submarine', 'usv'],
  facilities: ['naval_base', 'barracks', 'command_center', 'port', 'depot', 'warehouse'],
  defense: ['defensive_line', 'trench', 'watchtower', 'observation_post', 'missile_battery', 'launch_site'],
  hazards: ['restricted_zone', 'minefield', 'naval_mine'],
  navigation: ['navigation_buoy', 'waypoint', 'anchor_point', 'helipad'],
  units: ['uav', 'assembly_point', 'rally_point'],
};

export const CategoryLabelsAr: Record<string, string> = {
  ships: 'سفن',
  facilities: 'منشآت',
  defense: 'دفاعات',
  hazards: 'تهديدات',
  navigation: 'ملاحة',
  units: 'وحدات',
};
