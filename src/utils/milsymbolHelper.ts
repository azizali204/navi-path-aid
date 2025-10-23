// Helper functions for using milsymbol library
// Documentation: https://github.com/spatialillusions/milsymbol

declare global {
  interface Window {
    ms: any;
  }
}

export interface MilSymbolOptions {
  size?: number;
  fill?: string;
  frame?: boolean;
  icon?: boolean;
  uniqueDesignation?: string;
  higherFormation?: string;
  additionalInformation?: string;
  direction?: number;
  type?: string;
}

// NATO Symbol Identity Codes (SIDC)
export const NATOSymbols = {
  // Sea Surface
  SHIP_FRIENDLY: 'SFS-------', // Friendly Ship
  SHIP_HOSTILE: 'SHS-------', // Hostile Ship
  SHIP_NEUTRAL: 'SNS-------', // Neutral Ship
  SHIP_UNKNOWN: 'SUS-------', // Unknown Ship
  
  // Submarines
  SUBMARINE_FRIENDLY: 'SFS-S-----', // Friendly Submarine
  SUBMARINE_HOSTILE: 'SHS-S-----', // Hostile Submarine
  
  // Naval Installations
  NAVAL_BASE: 'SHGPUSN---', // Naval Base
  PORT: 'SHGPUSP---', // Port
  ANCHORAGE: 'SHGPUSA---', // Anchorage
  
  // Maritime Hazards
  MINE_FRIENDLY: 'SFGM------', // Friendly Mine
  MINE_HOSTILE: 'SHGM------', // Hostile Mine
  MINEFIELD: 'SHGMS-----', // Minefield
  
  // Aircraft
  HELICOPTER_FRIENDLY: 'SFA-------', // Friendly Helicopter
  HELICOPTER_HOSTILE: 'SHA-------', // Hostile Helicopter
  AIRCRAFT_FRIENDLY: 'SFAP------', // Friendly Fixed Wing
  AIRCRAFT_HOSTILE: 'SHAP------', // Hostile Fixed Wing
  UAV_FRIENDLY: 'SFAPMF----', // Friendly UAV
  UAV_HOSTILE: 'SHAPMF----', // Hostile UAV
  
  // Ground Units
  INFANTRY: 'SFGP------', // Friendly Infantry
  ARMOR: 'SFGPA-----', // Friendly Armor
  ARTILLERY: 'SFGPX-----', // Friendly Artillery
  HQ: 'SFGPH-----', // Friendly HQ
  
  // Control Points
  CONTROL_POINT: 'SHGPUC----', // Control Point
  CHECKPOINT: 'SHGPUCP---', // Checkpoint
  OBSERVATION_POST: 'SHGPUO----', // Observation Post
  
  // Maritime Specific
  PATROL_BOAT: 'SFSCL-----', // Patrol Boat
  DESTROYER: 'SFSCLD----', // Destroyer
  FRIGATE: 'SFSCLF----', // Frigate
  CORVETTE: 'SFSCLC----', // Corvette
  CARRIER: 'SFSCA-----', // Aircraft Carrier
  AMPHIBIOUS: 'SFSCLA----', // Amphibious Ship
};

// Create a NATO military symbol
export const createMilSymbol = (
  sidc: string,
  options: MilSymbolOptions = {}
): string => {
  if (!window.ms) {
    console.error('milsymbol library not loaded');
    return '';
  }

  try {
    const symbol = new window.ms.Symbol(sidc, {
      size: options.size || 30,
      fill: options.fill || true,
      frame: options.frame !== false,
      icon: options.icon !== false,
      uniqueDesignation: options.uniqueDesignation || '',
      higherFormation: options.higherFormation || '',
      additionalInformation: options.additionalInformation || '',
      direction: options.direction,
      type: options.type,
    });

    // Return as data URL for use in markers
    return symbol.toDataURL();
  } catch (error) {
    console.error('Error creating military symbol:', error);
    return '';
  }
};

// Get symbol by marker type
export const getSymbolByType = (
  type: string,
  severity: 'low' | 'medium' | 'high' = 'medium'
): string => {
  // Map marker types to NATO symbols
  const symbolMap: Record<string, string> = {
    ship: NATOSymbols.SHIP_FRIENDLY,
    submarine: NATOSymbols.SUBMARINE_FRIENDLY,
    naval_base: NATOSymbols.NAVAL_BASE,
    port: NATOSymbols.PORT,
    anchor_point: NATOSymbols.ANCHORAGE,
    minefield: NATOSymbols.MINEFIELD,
    helipad: NATOSymbols.HELICOPTER_FRIENDLY,
    aircraft: NATOSymbols.AIRCRAFT_FRIENDLY,
    uav: NATOSymbols.UAV_FRIENDLY,
    military: NATOSymbols.HQ,
    patrol_boat: NATOSymbols.PATROL_BOAT,
    destroyer: NATOSymbols.DESTROYER,
    frigate: NATOSymbols.FRIGATE,
    carrier: NATOSymbols.CARRIER,
    defensive_line: NATOSymbols.CONTROL_POINT,
    watchtower: NATOSymbols.OBSERVATION_POST,
    restricted_zone: NATOSymbols.CONTROL_POINT,
    hazard: NATOSymbols.MINEFIELD,
  };

  const sidc = symbolMap[type] || NATOSymbols.SHIP_FRIENDLY;
  
  // Adjust based on severity
  let adjustedSIDC = sidc;
  if (severity === 'high') {
    // Change to hostile (H instead of F)
    adjustedSIDC = sidc.replace('SF', 'SH').replace('SN', 'SH').replace('SU', 'SH');
  } else if (severity === 'low') {
    // Change to neutral (N instead of F)
    adjustedSIDC = sidc.replace('SF', 'SN').replace('SH', 'SN');
  }

  return createMilSymbol(adjustedSIDC, {
    size: 35,
  });
};

// Available symbol categories for UI
export const SymbolCategories = [
  { id: 'ship', name: 'سفينة', sidc: NATOSymbols.SHIP_FRIENDLY },
  { id: 'submarine', name: 'غواصة', sidc: NATOSymbols.SUBMARINE_FRIENDLY },
  { id: 'patrol_boat', name: 'زورق دورية', sidc: NATOSymbols.PATROL_BOAT },
  { id: 'destroyer', name: 'مدمرة', sidc: NATOSymbols.DESTROYER },
  { id: 'frigate', name: 'فرقاطة', sidc: NATOSymbols.FRIGATE },
  { id: 'carrier', name: 'حاملة طائرات', sidc: NATOSymbols.CARRIER },
  { id: 'naval_base', name: 'قاعدة بحرية', sidc: NATOSymbols.NAVAL_BASE },
  { id: 'port', name: 'ميناء', sidc: NATOSymbols.PORT },
  { id: 'anchor_point', name: 'نقطة رسو', sidc: NATOSymbols.ANCHORAGE },
  { id: 'minefield', name: 'حقل ألغام', sidc: NATOSymbols.MINEFIELD },
  { id: 'helipad', name: 'مهبط مروحيات', sidc: NATOSymbols.HELICOPTER_FRIENDLY },
  { id: 'aircraft', name: 'طائرة', sidc: NATOSymbols.AIRCRAFT_FRIENDLY },
  { id: 'uav', name: 'طائرة بدون طيار', sidc: NATOSymbols.UAV_FRIENDLY },
  { id: 'military', name: 'قيادة عسكرية', sidc: NATOSymbols.HQ },
  { id: 'watchtower', name: 'برج مراقبة', sidc: NATOSymbols.OBSERVATION_POST },
  { id: 'restricted_zone', name: 'منطقة محظورة', sidc: NATOSymbols.CONTROL_POINT },
];
