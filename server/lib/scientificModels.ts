// Scientific Models and Laws Implementation
// This module implements actual scientific equations and validates results

export interface ScientificModel {
  name: string;
  equation: string;
  parameters: Record<string, number>;
  calculate: (t: number) => number;
  validate: (data: Array<{ x: number; y: number }>) => boolean;
  constraints: {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    monotonic?: 'increasing' | 'decreasing' | 'none';
    asymptote?: number;
  };
}

export interface ModelMatch {
  model: ScientificModel;
  confidence: number;
  parameters: Record<string, number>;
}

/**
 * Parse description to identify and extract parameters for scientific models
 */
export function identifyScientificModel(description: string): ModelMatch | null {
  const desc = description.toLowerCase();
  
  // Logistic Growth Model
  if (desc.includes('population') && (desc.includes('carrying capacity') || desc.includes('limited') || desc.includes('saturation'))) {
    const initialPop = extractNumber(desc, ['starting', 'initial', 'begin'], 100);
    const growthRate = extractPercentage(desc, ['growth', 'increase', 'rate'], 0.2);
    const carryingCapacity = extractNumber(desc, ['carrying capacity', 'limit', 'maximum', 'max'], 10000);
    
    return {
      model: createLogisticGrowthModel(),
      confidence: 0.9,
      parameters: {
        N0: initialPop,
        r: growthRate,
        K: carryingCapacity
      }
    };
  }
  
  // Newton's Law of Cooling
  if (desc.includes('cooling') || desc.includes('temperature') && (desc.includes('room') || desc.includes('environment'))) {
    const initialTemp = extractNumber(desc, ['starting', 'initial', 'begin'], 90);
    const roomTemp = extractNumber(desc, ['room', 'ambient', 'environment'], 20);
    const coolingConstant = extractNumber(desc, ['cooling constant', 'constant'], 0.1);
    
    return {
      model: createNewtonsLawOfCoolingModel(),
      confidence: 0.9,
      parameters: {
        T0: initialTemp,
        Ta: roomTemp,
        k: coolingConstant
      }
    };
  }
  
  // Exponential Decay
  if (desc.includes('decay') || desc.includes('radioactive') || desc.includes('half-life')) {
    const initial = extractNumber(desc, ['initial', 'starting', 'begin'], 100);
    const decayConstant = extractNumber(desc, ['decay constant', 'constant', 'lambda'], 0.1);
    
    return {
      model: createExponentialDecayModel(),
      confidence: 0.85,
      parameters: {
        N0: initial,
        lambda: decayConstant
      }
    };
  }
  
  // Simple Harmonic Motion / Oscillation
  if (desc.includes('oscillat') || desc.includes('pendulum') || desc.includes('spring') || desc.includes('harmonic')) {
    const amplitude = extractNumber(desc, ['amplitude', 'maximum'], 1);
    const frequency = extractNumber(desc, ['frequency', 'period'], 1);
    const phase = extractNumber(desc, ['phase'], 0);
    
    return {
      model: createSimpleHarmonicMotionModel(),
      confidence: 0.85,
      parameters: {
        A: amplitude,
        omega: frequency,
        phi: phase
      }
    };
  }
  
  return null;
}

/**
 * Generate scientifically accurate data points using identified model
 */
export function generateScientificData(match: ModelMatch, timeRange: [number, number], numPoints: number = 100): Array<{ x: number; y: number }> {
  const [tMin, tMax] = timeRange;
  const dt = (tMax - tMin) / (numPoints - 1);
  const data: Array<{ x: number; y: number }> = [];
  
  // Configure the model with extracted parameters
  const model = { ...match.model };
  Object.assign(model, { parameters: match.parameters });
  
  for (let i = 0; i < numPoints; i++) {
    const t = tMin + i * dt;
    const y = model.calculate(t);
    data.push({ x: t, y });
  }
  
  // Validate the generated data
  if (!model.validate(data)) {
    throw new Error(`Generated data violates physical constraints for model: ${model.name}`);
  }
  
  return data;
}

/**
 * Logistic Growth Model: N(t) = K / (1 + ((K - N0) / N0) * e^(-rt))
 */
function createLogisticGrowthModel(): ScientificModel {
  return {
    name: 'Logistic Growth',
    equation: 'N(t) = K / (1 + ((K - N₀) / N₀) * e^(-rt))',
    parameters: { N0: 100, r: 0.2, K: 10000 },
    calculate: function(t: number): number {
      const { N0, r, K } = this.parameters;
      return K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
    },
    validate: function(data: Array<{ x: number; y: number }>): boolean {
      const { K } = this.parameters;
      // Check: monotonic increasing, asymptotic to K, starts above 0
      return data.every(d => d.y > 0 && d.y <= K * 1.01) &&
             isMonotonicIncreasing(data) &&
             Math.abs(data[data.length - 1].y - K) < K * 0.1;
    },
    constraints: {
      yMin: 0,
      monotonic: 'increasing',
      asymptote: 10000
    }
  };
}

/**
 * Newton's Law of Cooling: T(t) = Ta + (T0 - Ta) * e^(-kt)
 */
function createNewtonsLawOfCoolingModel(): ScientificModel {
  return {
    name: "Newton's Law of Cooling",
    equation: 'T(t) = Tₐ + (T₀ - Tₐ) * e^(-kt)',
    parameters: { T0: 90, Ta: 20, k: 0.1 },
    calculate: function(t: number): number {
      const { T0, Ta, k } = this.parameters;
      return Ta + (T0 - Ta) * Math.exp(-k * t);
    },
    validate: function(data: Array<{ x: number; y: number }>): boolean {
      const { Ta, T0 } = this.parameters;
      // Check: monotonic decreasing towards Ta, never below Ta, starts at T0
      return data.every(d => d.y >= Ta * 0.99) &&
             isMonotonicDecreasing(data) &&
             Math.abs(data[0].y - T0) < 1 &&
             Math.abs(data[data.length - 1].y - Ta) < Math.abs(T0 - Ta) * 0.5;
    },
    constraints: {
      monotonic: 'decreasing',
      asymptote: 20
    }
  };
}

/**
 * Exponential Decay: N(t) = N0 * e^(-λt)
 */
function createExponentialDecayModel(): ScientificModel {
  return {
    name: 'Exponential Decay',
    equation: 'N(t) = N₀ * e^(-λt)',
    parameters: { N0: 100, lambda: 0.1 },
    calculate: function(t: number): number {
      const { N0, lambda } = this.parameters;
      return N0 * Math.exp(-lambda * t);
    },
    validate: function(data: Array<{ x: number; y: number }>): boolean {
      const { N0 } = this.parameters;
      // Check: monotonic decreasing, approaches 0, starts at N0
      return data.every(d => d.y >= 0) &&
             isMonotonicDecreasing(data) &&
             Math.abs(data[0].y - N0) < N0 * 0.01;
    },
    constraints: {
      yMin: 0,
      monotonic: 'decreasing',
      asymptote: 0
    }
  };
}

/**
 * Simple Harmonic Motion: x(t) = A * cos(ωt + φ)
 */
function createSimpleHarmonicMotionModel(): ScientificModel {
  return {
    name: 'Simple Harmonic Motion',
    equation: 'x(t) = A * cos(ωt + φ)',
    parameters: { A: 1, omega: 1, phi: 0 },
    calculate: function(t: number): number {
      const { A, omega, phi } = this.parameters;
      return A * Math.cos(omega * t + phi);
    },
    validate: function(data: Array<{ x: number; y: number }>): boolean {
      const { A } = this.parameters;
      // Check: bounded oscillation within [-A, A]
      return data.every(d => Math.abs(d.y) <= A * 1.01);
    },
    constraints: {
      monotonic: 'none'
    }
  };
}

// Utility Functions

function extractNumber(text: string, keywords: string[], defaultValue: number): number {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[^\\d]*(\\d+(?:\\.\\d+)?)`, 'i');
    const match = text.match(regex);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return defaultValue;
}

function extractPercentage(text: string, keywords: string[], defaultValue: number): number {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[^\\d]*(\\d+(?:\\.\\d+)?)%`, 'i');
    const match = text.match(regex);
    if (match) {
      return parseFloat(match[1]) / 100;
    }
  }
  return defaultValue;
}

function isMonotonicIncreasing(data: Array<{ x: number; y: number }>): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i].y < data[i - 1].y) return false;
  }
  return true;
}

function isMonotonicDecreasing(data: Array<{ x: number; y: number }>): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i].y > data[i - 1].y) return false;
  }
  return true;
}

/**
 * Apply domain-appropriate constraints for unrecognized models
 */
export function applyDomainConstraints(description: string, data: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const desc = description.toLowerCase();
  
  // Population/biological constraints
  if (desc.includes('population') || desc.includes('organism') || desc.includes('species')) {
    // Ensure no negative populations
    return data.map(d => ({ ...d, y: Math.max(0, d.y) }));
  }
  
  // Temperature constraints  
  if (desc.includes('temperature') || desc.includes('heat')) {
    // Ensure reasonable temperature bounds (absolute zero to reasonable max)
    return data.map(d => ({ ...d, y: Math.max(-273, Math.min(10000, d.y)) }));
  }
  
  // Economic/financial constraints
  if (desc.includes('price') || desc.includes('cost') || desc.includes('value')) {
    // Ensure no negative values for most economic quantities
    return data.map(d => ({ ...d, y: Math.max(0, d.y) }));
  }
  
  return data;
}