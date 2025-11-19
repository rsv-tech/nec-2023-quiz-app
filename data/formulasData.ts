export interface FormulaItem {
  id: string;
  name: string;
  formula: string;
  description: string;
  necRef?: string;
  category: string;
  subcategory?: string;
}

export interface FormulaCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  formulas: FormulaItem[];
}

export const formulasData: FormulaCategory[] = [
  {
    id: 'ohms-law',
    title: "Ohm's Law",
    description: 'Fundamental relationships between voltage, current, and resistance',
    icon: '⚡',
    formulas: [
      {
        id: 'voltage',
        name: 'Voltage (E)',
        formula: 'E = I × R',
        description: 'Volts = Amps × Ohms',
        category: 'ohms-law'
      },
      {
        id: 'current',
        name: 'Current (I)',
        formula: 'I = E / R',
        description: 'Amps = Volts / Ohms',
        category: 'ohms-law'
      },
      {
        id: 'resistance',
        name: 'Resistance (R)',
        formula: 'R = E / I',
        description: 'Ohms = Volts / Amps',
        category: 'ohms-law'
      }
    ]
  },
  {
    id: 'power',
    title: 'Power Formulas',
    description: 'Calculate power in electrical circuits',
    icon: '🔋',
    formulas: [
      {
        id: 'power-ei',
        name: 'Power (P)',
        formula: 'P = E × I',
        description: 'Watts = Volts × Amps',
        category: 'power'
      },
      {
        id: 'power-i2r',
        name: 'Power (P)',
        formula: 'P = I² × R',
        description: 'Watts = Amps² × Ohms',
        category: 'power'
      },
      {
        id: 'power-e2r',
        name: 'Power (P)',
        formula: 'P = E² / R',
        description: 'Watts = Volts² / Ohms',
        category: 'power'
      },
      {
        id: 'horsepower',
        name: 'Horsepower',
        formula: '1 HP = 746 W',
        description: 'Mechanical power conversion',
        category: 'power'
      },
      {
        id: 'hp-output',
        name: 'Horsepower',
        formula: 'HP = Output Watts / 746',
        description: 'Convert watts to horsepower',
        category: 'power'
      }
    ]
  },
  {
    id: 'voltage-drop',
    title: 'Voltage Drop',
    description: 'Calculate voltage drop in conductors',
    icon: '📉',
    formulas: [
      {
        id: 'vd-single',
        name: 'Single Phase',
        formula: 'VD = (2 × K × I × D) / Cmil',
        description: 'K=12.9 (Cu), K=21.2 (Al), I=Amps, D=Distance one way',
        category: 'voltage-drop',
        necRef: 'Chapter 9, Table 8'
      },
      {
        id: 'vd-three',
        name: 'Three Phase',
        formula: 'VD = (√3 × K × I × D) / Cmil',
        description: 'For 3-phase circuits',
        category: 'voltage-drop',
        necRef: 'Chapter 9, Table 8'
      },
      {
        id: 'cmil-single',
        name: 'Circular Mils (Single Phase)',
        formula: 'Cmil = (2 × K × I × D) / VD',
        description: 'Calculate required conductor size',
        category: 'voltage-drop'
      },
      {
        id: 'cmil-three',
        name: 'Circular Mils (Three Phase)',
        formula: 'Cmil = (√3 × K × I × D) / VD',
        description: 'Calculate required conductor size for 3-phase',
        category: 'voltage-drop'
      }
    ]
  },
  {
    id: 'ac-formulas',
    title: 'AC Formulas',
    description: 'RMS, peak values, and AC power calculations',
    icon: '〰️',
    formulas: [
      {
        id: 'vrms',
        name: 'RMS Voltage',
        formula: 'Vrms = Vpeak × 0.707',
        description: 'Effective AC voltage',
        category: 'ac-formulas'
      },
      {
        id: 'irms',
        name: 'RMS Current',
        formula: 'Irms = Ipeak × 0.707',
        description: 'Effective AC current',
        category: 'ac-formulas'
      },
      {
        id: 'vpeak',
        name: 'Peak Voltage',
        formula: 'Vpeak = Vrms × √2',
        description: 'Peak AC voltage (√2 ≈ 1.414)',
        category: 'ac-formulas'
      },
      {
        id: 'ipeak',
        name: 'Peak Current',
        formula: 'Ipeak = Irms × √2',
        description: 'Peak AC current (√2 ≈ 1.414)',
        category: 'ac-formulas'
      },
      {
        id: 'pf',
        name: 'Power Factor',
        formula: 'PF = Watts / VA',
        description: 'Ratio of real to apparent power',
        category: 'ac-formulas'
      },
      {
        id: 'va-single',
        name: 'Apparent Power (Single Phase)',
        formula: 'VA = Volts × Amperes',
        description: 'Or VA = Watts / PF',
        category: 'ac-formulas'
      },
      {
        id: 'va-three',
        name: 'Apparent Power (Three Phase)',
        formula: 'VA = Volts × Amperes × √3',
        description: 'Three phase apparent power',
        category: 'ac-formulas'
      },
      {
        id: 'watts-single',
        name: 'Real Power (Single Phase)',
        formula: 'W = V × I × PF',
        description: 'Single phase real power',
        category: 'ac-formulas'
      },
      {
        id: 'watts-three',
        name: 'Real Power (Three Phase)',
        formula: 'W = V × I × PF × √3',
        description: 'Three phase real power',
        category: 'ac-formulas'
      }
    ]
  },
  {
    id: 'reactance',
    title: 'Reactance & Impedance',
    description: 'Inductive and capacitive reactance',
    icon: '🔄',
    formulas: [
      {
        id: 'xl',
        name: 'Inductive Reactance (XL)',
        formula: 'XL = 2π × f × L',
        description: 'f=frequency (Hz), L=inductance (henrys)',
        category: 'reactance'
      },
      {
        id: 'xc',
        name: 'Capacitive Reactance (XC)',
        formula: 'XC = 1 / (2π × f × C)',
        description: 'f=frequency (Hz), C=capacitance (farads)',
        category: 'reactance'
      }
    ]
  },
  {
    id: 'transformers',
    title: 'Transformer Formulas',
    description: 'Transformer calculations and fault current',
    icon: '🔌',
    formulas: [
      {
        id: 'xfmr-amps-single',
        name: 'Secondary Amps (Single Phase)',
        formula: 'I = VA / V',
        description: 'Transformer secondary current',
        category: 'transformers'
      },
      {
        id: 'xfmr-amps-three',
        name: 'Secondary Amps (Three Phase)',
        formula: 'I = VA / (V × √3)',
        description: 'Three phase transformer current',
        category: 'transformers'
      },
      {
        id: 'fault-single',
        name: 'Available Fault (Single Phase)',
        formula: 'If = VA / (V × Z%)',
        description: 'Z% = transformer impedance percentage',
        category: 'transformers'
      },
      {
        id: 'fault-three',
        name: 'Available Fault (Three Phase)',
        formula: 'If = VA / (V × √3 × Z%)',
        description: 'Three phase fault current',
        category: 'transformers'
      },
      {
        id: 'delta-line-amps',
        name: 'Delta Line Amperes',
        formula: 'Iline = Iphase × √3',
        description: 'Delta 4-wire configuration',
        category: 'transformers'
      },
      {
        id: 'delta-high-leg',
        name: 'Delta High Leg Voltage',
        formula: 'Vhigh-leg = Vphase × 0.5 × √3',
        description: 'Line to ground voltage on high leg',
        category: 'transformers'
      },
      {
        id: 'wye-line-volts',
        name: 'Wye Line Volts',
        formula: 'Vline = Vphase × √3',
        description: 'Wye configuration line voltage',
        category: 'transformers'
      },
      {
        id: 'wye-line-amps',
        name: 'Wye Line Amperes',
        formula: 'Iline = Iphase',
        description: 'Line current equals phase current in wye',
        category: 'transformers'
      }
    ]
  },
  {
    id: 'circuits',
    title: 'Series & Parallel Circuits',
    description: 'Resistance calculations for circuit configurations',
    icon: '🔗',
    formulas: [
      {
        id: 'series-r',
        name: 'Series Resistance',
        formula: 'RT = R1 + R2 + R3 + ...',
        description: 'Total resistance in series',
        category: 'circuits'
      },
      {
        id: 'parallel-r',
        name: 'Parallel Resistance',
        formula: '1/RT = 1/R1 + 1/R2 + 1/R3 + ...',
        description: 'Total resistance always less than smallest resistor',
        category: 'circuits'
      }
    ]
  },
  {
    id: 'conversions',
    title: 'Unit Conversions',
    description: 'Common electrical and measurement conversions',
    icon: '🔄',
    formulas: [
      {
        id: 'temp-c',
        name: 'Celsius',
        formula: '°C = (°F - 32) / 1.8',
        description: 'Fahrenheit to Celsius',
        category: 'conversions'
      },
      {
        id: 'temp-f',
        name: 'Fahrenheit',
        formula: '°F = (°C × 1.8) + 32',
        description: 'Celsius to Fahrenheit',
        category: 'conversions'
      },
      {
        id: 'inch-cm',
        name: 'Centimeters',
        formula: 'cm = inches × 2.54',
        description: 'Inches to centimeters',
        category: 'conversions'
      },
      {
        id: 'cm-inch',
        name: 'Inches',
        formula: 'inches = cm / 2.54',
        description: 'Centimeters to inches',
        category: 'conversions'
      },
      {
        id: 'inch-mm',
        name: 'Millimeters',
        formula: 'mm = inches × 25.4',
        description: 'Inches to millimeters',
        category: 'conversions'
      },
      {
        id: 'meter-inch',
        name: 'Meters to Inches',
        formula: 'inches = meters × 39.37',
        description: 'Meter conversion',
        category: 'conversions'
      },
      {
        id: 'km-mile',
        name: 'Kilometers to Miles',
        formula: 'miles = km × 0.6213',
        description: 'Kilometer conversion',
        category: 'conversions'
      },
      {
        id: 'mile-feet',
        name: 'Mile',
        formula: '1 mile = 5280 ft = 1760 yd = 1609 m',
        description: 'Mile equivalents',
        category: 'conversions'
      },
      {
        id: 'yard-meter',
        name: 'Yard',
        formula: '1 yard = 0.9144 meters',
        description: 'Yard to meter',
        category: 'conversions'
      }
    ]
  },
  {
    id: 'constants',
    title: 'NEC Constants & Values',
    description: 'Important constants and typical values',
    icon: '📊',
    formulas: [
      {
        id: 'pi',
        name: 'Pi (π)',
        formula: 'π ≈ 3.142',
        description: 'Mathematical constant',
        category: 'constants'
      },
      {
        id: 'sqrt2',
        name: 'Square Root of 2',
        formula: '√2 ≈ 1.414',
        description: 'Used in AC calculations',
        category: 'constants'
      },
      {
        id: 'sqrt3',
        name: 'Square Root of 3',
        formula: '√3 ≈ 1.732',
        description: 'Used in three-phase calculations',
        category: 'constants'
      },
      {
        id: 'k-copper',
        name: 'K Constant (Copper)',
        formula: 'K = 12.9 Ω',
        description: 'At 75°C for voltage drop calculations',
        category: 'constants'
      },
      {
        id: 'k-aluminum',
        name: 'K Constant (Aluminum)',
        formula: 'K = 21.2 Ω',
        description: 'At 75°C for voltage drop calculations',
        category: 'constants'
      },
      {
        id: 'busbar-cu',
        name: 'Busbar Ampacity (Copper)',
        formula: '1000 A per sq.in',
        description: 'Typical copper busbar rating',
        category: 'constants'
      },
      {
        id: 'busbar-al',
        name: 'Busbar Ampacity (Aluminum)',
        formula: '700 A per sq.in',
        description: 'Typical aluminum busbar rating',
        category: 'constants'
      },
      {
        id: 'sound-speed',
        name: 'Speed of Sound',
        formula: '1128 fps = 769 mph',
        description: 'At sea level',
        category: 'constants'
      },
      {
        id: 'circle-area',
        name: 'Area of Circle',
        formula: 'A = π × r²',
        description: 'r = radius',
        category: 'constants'
      },
      {
        id: 'coil-length',
        name: 'Coiled Wire Length',
        formula: 'L = D × N × π',
        description: 'D=avg diameter, N=number of coils',
        category: 'constants'
      }
    ]
  },
  {
    id: 'efficiency',
    title: 'Efficiency & Performance',
    description: 'Efficiency and performance calculations',
    icon: '📈',
    formulas: [
      {
        id: 'efficiency-pct',
        name: 'Efficiency (Percent)',
        formula: 'Eff% = (Output / Input) × 100',
        description: 'Percentage efficiency',
        category: 'efficiency'
      },
      {
        id: 'efficiency',
        name: 'Efficiency',
        formula: 'Eff = Output / Input',
        description: 'Decimal efficiency',
        category: 'efficiency'
      },
      {
        id: 'input',
        name: 'Input',
        formula: 'Input = Output / Efficiency',
        description: 'Calculate required input',
        category: 'efficiency'
      },
      {
        id: 'output',
        name: 'Output',
        formula: 'Output = Input × Efficiency',
        description: 'Calculate output power',
        category: 'efficiency'
      }
    ]
  },
  {
    id: 'neutral',
    title: 'Neutral Current (Wye)',
    description: 'Calculate neutral current in wye systems',
    icon: '⚡',
    formulas: [
      {
        id: 'neutral-current',
        name: 'Neutral Current',
        formula: 'In = √[(IL1² + IL2² + IL3²) - ((IL1×IL2) + (IL2×IL3) + (IL3×IL1))]',
        description: 'Unbalanced wye system neutral current',
        category: 'neutral'
      }
    ]
  }
];

// Helper function to get all formulas flattened
export const getAllFormulas = (): FormulaItem[] => {
  return formulasData.flatMap(category => category.formulas);
};

// Helper function to search formulas
export const searchFormulas = (query: string): FormulaItem[] => {
  const lowerQuery = query.toLowerCase();
  return getAllFormulas().filter(
    formula =>
      formula.name.toLowerCase().includes(lowerQuery) ||
      formula.formula.toLowerCase().includes(lowerQuery) ||
      formula.description.toLowerCase().includes(lowerQuery)
  );
};
