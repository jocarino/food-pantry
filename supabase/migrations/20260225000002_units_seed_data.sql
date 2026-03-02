-- Migration 2: Units Seed Data
-- Populates the units table with comprehensive measurement units

-- =====================================================
-- WEIGHT UNITS (base unit: grams)
-- =====================================================
INSERT INTO units (code, name, plural_name, type, system, base_unit_multiplier) VALUES
('mg', 'milligram', 'milligrams', 'weight', 'metric', 0.001),
('g', 'gram', 'grams', 'weight', 'metric', 1),
('kg', 'kilogram', 'kilograms', 'weight', 'metric', 1000),
('oz', 'ounce', 'ounces', 'weight', 'imperial', 28.3495),
('lb', 'pound', 'pounds', 'weight', 'imperial', 453.592);

-- =====================================================
-- VOLUME UNITS (base unit: milliliters)
-- =====================================================
INSERT INTO units (code, name, plural_name, type, system, base_unit_multiplier) VALUES
('ml', 'milliliter', 'milliliters', 'volume', 'metric', 1),
('cl', 'centiliter', 'centiliters', 'volume', 'metric', 10),
('dl', 'deciliter', 'deciliters', 'volume', 'metric', 100),
('l', 'liter', 'liters', 'volume', 'metric', 1000),
('tsp', 'teaspoon', 'teaspoons', 'volume', 'universal', 4.92892),
('tbsp', 'tablespoon', 'tablespoons', 'volume', 'universal', 14.7868),
('fl oz', 'fluid ounce', 'fluid ounces', 'volume', 'imperial', 29.5735),
('cup', 'cup', 'cups', 'volume', 'imperial', 236.588),
('pt', 'pint', 'pints', 'volume', 'imperial', 473.176),
('qt', 'quart', 'quarts', 'volume', 'imperial', 946.353),
('gal', 'gallon', 'gallons', 'volume', 'imperial', 3785.41);

-- =====================================================
-- COUNT UNITS (no conversion, dimensionless)
-- =====================================================
INSERT INTO units (code, name, plural_name, type, system, base_unit_multiplier) VALUES
('piece', 'piece', 'pieces', 'count', 'universal', NULL),
('item', 'item', 'items', 'count', 'universal', NULL),
('whole', 'whole', 'whole', 'count', 'universal', NULL),
('clove', 'clove', 'cloves', 'count', 'universal', NULL),
('head', 'head', 'heads', 'count', 'universal', NULL),
('bunch', 'bunch', 'bunches', 'count', 'universal', NULL),
('stalk', 'stalk', 'stalks', 'count', 'universal', NULL),
('sprig', 'sprig', 'sprigs', 'count', 'universal', NULL),
('leaf', 'leaf', 'leaves', 'count', 'universal', NULL),
('slice', 'slice', 'slices', 'count', 'universal', NULL),
('strip', 'strip', 'strips', 'count', 'universal', NULL),
('wedge', 'wedge', 'wedges', 'count', 'universal', NULL),
('can', 'can', 'cans', 'count', 'universal', NULL),
('jar', 'jar', 'jars', 'count', 'universal', NULL),
('bottle', 'bottle', 'bottles', 'count', 'universal', NULL),
('package', 'package', 'packages', 'count', 'universal', NULL),
('bag', 'bag', 'bags', 'count', 'universal', NULL),
('box', 'box', 'boxes', 'count', 'universal', NULL),
('container', 'container', 'containers', 'count', 'universal', NULL),
('pinch', 'pinch', 'pinches', 'count', 'universal', NULL),
('dash', 'dash', 'dashes', 'count', 'universal', NULL),
('handful', 'handful', 'handfuls', 'count', 'universal', NULL);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN units.base_unit_multiplier IS 'Multiplier to convert to base unit: grams for weight, milliliters for volume, NULL for count';
