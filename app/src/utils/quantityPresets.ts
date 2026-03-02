/**
 * Quantity presets for common grocery items
 * Helps users select realistic purchase quantities instead of exact recipe amounts
 */

export interface QuantityPreset {
  value: number;
  unit: string;
  label: string;
}

/**
 * Get quantity presets based on item name and unit
 * Returns common purchase sizes for the grocery store
 */
export function getQuantityPresets(itemName: string, currentUnit: string): QuantityPreset[] {
  const nameLower = itemName.toLowerCase();
  
  // Eggs - always in counts
  if (nameLower.includes('egg')) {
    return [
      { value: 6, unit: 'count', label: '6 eggs' },
      { value: 12, unit: 'count', label: '12 eggs (1 dozen)' },
      { value: 18, unit: 'count', label: '18 eggs' },
      { value: 30, unit: 'count', label: '30 eggs' },
    ];
  }

  // Milk and liquids
  if (nameLower.includes('milk') || nameLower.includes('cream') || nameLower.includes('juice')) {
    const isMetric = currentUnit === 'ml' || currentUnit === 'l';
    if (isMetric) {
      return [
        { value: 500, unit: 'ml', label: '500 ml' },
        { value: 1, unit: 'l', label: '1 liter' },
        { value: 2, unit: 'l', label: '2 liters' },
        { value: 4, unit: 'l', label: '4 liters' },
      ];
    } else {
      return [
        { value: 16, unit: 'fl oz', label: '16 fl oz (1 pint)' },
        { value: 32, unit: 'fl oz', label: '32 fl oz (1 quart)' },
        { value: 64, unit: 'fl oz', label: '64 fl oz (half gallon)' },
        { value: 128, unit: 'fl oz', label: '128 fl oz (1 gallon)' },
      ];
    }
  }

  // Flour, sugar, rice, and other dry goods
  if (
    nameLower.includes('flour') || 
    nameLower.includes('sugar') || 
    nameLower.includes('rice') ||
    nameLower.includes('pasta') ||
    nameLower.includes('oats')
  ) {
    const isMetric = currentUnit === 'g' || currentUnit === 'kg';
    if (isMetric) {
      return [
        { value: 500, unit: 'g', label: '500 g' },
        { value: 1, unit: 'kg', label: '1 kg' },
        { value: 2, unit: 'kg', label: '2 kg' },
        { value: 5, unit: 'kg', label: '5 kg' },
      ];
    } else {
      return [
        { value: 1, unit: 'lb', label: '1 lb' },
        { value: 2, unit: 'lb', label: '2 lbs' },
        { value: 5, unit: 'lb', label: '5 lbs' },
        { value: 10, unit: 'lb', label: '10 lbs' },
      ];
    }
  }

  // Meat, chicken, fish
  if (
    nameLower.includes('chicken') || 
    nameLower.includes('beef') || 
    nameLower.includes('pork') ||
    nameLower.includes('fish') ||
    nameLower.includes('meat')
  ) {
    const isMetric = currentUnit === 'g' || currentUnit === 'kg';
    if (isMetric) {
      return [
        { value: 250, unit: 'g', label: '250 g' },
        { value: 500, unit: 'g', label: '500 g' },
        { value: 1, unit: 'kg', label: '1 kg' },
        { value: 2, unit: 'kg', label: '2 kg' },
      ];
    } else {
      return [
        { value: 0.5, unit: 'lb', label: '0.5 lb (8 oz)' },
        { value: 1, unit: 'lb', label: '1 lb' },
        { value: 2, unit: 'lb', label: '2 lbs' },
        { value: 3, unit: 'lb', label: '3 lbs' },
      ];
    }
  }

  // Butter
  if (nameLower.includes('butter')) {
    const isMetric = currentUnit === 'g' || currentUnit === 'kg';
    if (isMetric) {
      return [
        { value: 250, unit: 'g', label: '250 g (1 block)' },
        { value: 500, unit: 'g', label: '500 g (2 blocks)' },
      ];
    } else {
      return [
        { value: 8, unit: 'oz', label: '8 oz (1 block)' },
        { value: 16, unit: 'oz', label: '16 oz (2 blocks)' },
      ];
    }
  }

  // Cheese
  if (nameLower.includes('cheese')) {
    const isMetric = currentUnit === 'g' || currentUnit === 'kg';
    if (isMetric) {
      return [
        { value: 200, unit: 'g', label: '200 g' },
        { value: 500, unit: 'g', label: '500 g' },
        { value: 1, unit: 'kg', label: '1 kg' },
      ];
    } else {
      return [
        { value: 8, unit: 'oz', label: '8 oz' },
        { value: 16, unit: 'oz', label: '1 lb' },
        { value: 32, unit: 'oz', label: '2 lbs' },
      ];
    }
  }

  // Produce (loose items like apples, tomatoes, etc.)
  if (
    nameLower.includes('apple') || 
    nameLower.includes('orange') || 
    nameLower.includes('tomato') ||
    nameLower.includes('potato') ||
    nameLower.includes('onion') ||
    nameLower.includes('banana')
  ) {
    return [
      { value: 3, unit: 'count', label: '3 items' },
      { value: 5, unit: 'count', label: '5 items' },
      { value: 10, unit: 'count', label: '10 items (bag)' },
      { value: 1, unit: 'bag', label: '1 bag' },
    ];
  }

  // Canned goods
  if (nameLower.includes('can') || nameLower.includes('tin')) {
    return [
      { value: 1, unit: 'can', label: '1 can' },
      { value: 2, unit: 'can', label: '2 cans' },
      { value: 4, unit: 'can', label: '4 cans' },
      { value: 6, unit: 'can', label: '6 cans' },
    ];
  }

  // Default presets based on unit type
  if (currentUnit === 'g' || currentUnit === 'kg') {
    return [
      { value: 250, unit: 'g', label: '250 g' },
      { value: 500, unit: 'g', label: '500 g' },
      { value: 1, unit: 'kg', label: '1 kg' },
    ];
  }
  
  if (currentUnit === 'lb' || currentUnit === 'oz') {
    return [
      { value: 8, unit: 'oz', label: '8 oz' },
      { value: 1, unit: 'lb', label: '1 lb' },
      { value: 2, unit: 'lb', label: '2 lbs' },
    ];
  }

  if (currentUnit === 'ml' || currentUnit === 'l') {
    return [
      { value: 500, unit: 'ml', label: '500 ml' },
      { value: 1, unit: 'l', label: '1 liter' },
      { value: 2, unit: 'l', label: '2 liters' },
    ];
  }

  // Generic count-based items
  return [
    { value: 1, unit: 'count', label: '1 item' },
    { value: 2, unit: 'count', label: '2 items' },
    { value: 5, unit: 'count', label: '5 items' },
    { value: 10, unit: 'count', label: '10 items' },
  ];
}

/**
 * Format a quantity and unit for display
 */
export function formatQuantity(quantity: number | null, unit: string | null): string {
  if (quantity === null || quantity === 0) {
    return '';
  }
  
  if (!unit) {
    return quantity.toString();
  }

  // Handle fractional quantities nicely
  if (quantity < 1 && quantity > 0) {
    return `${quantity} ${unit}`;
  }

  // Integer quantities
  if (Number.isInteger(quantity)) {
    return `${quantity} ${unit}`;
  }

  // Decimal quantities - round to 1 decimal place
  return `${quantity.toFixed(1)} ${unit}`;
}
