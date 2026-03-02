#!/usr/bin/env node
/**
 * Seed Test Data Script
 * Creates test recipe and pantry items for testing the cook workflow
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // service_role key

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_RECIPE_ID = '10000000-0000-0000-0000-000000000001';
const TEST_RECIPE_VERSION_ID = '10000000-0000-0000-0000-000000000002';

async function seedTestData() {
  console.log('🌱 Starting test data seed...\n');

  try {
    // 1. Create test recipe
    console.log('Creating test recipe: "Test Pancakes"...');
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .upsert({
        id: TEST_RECIPE_ID,
        user_id: TEST_USER_ID,
        title: 'Test Pancakes',
        description: 'Simple pancakes recipe for testing the cook workflow',
      }, { onConflict: 'id' })
      .select()
      .single();

    if (recipeError) {
      console.error('❌ Error creating recipe:', recipeError);
      throw recipeError;
    }
    console.log('✅ Recipe created successfully\n');

    // 2. Create recipe version with ingredients
    console.log('Creating recipe version with ingredients...');
    const ingredients = [
      {
        name: 'flour',
        metric_quantity: 250,
        metric_unit: 'g',
        imperial_quantity: 2,
        imperial_unit: 'cups'
      },
      {
        name: 'milk',
        metric_quantity: 500,
        metric_unit: 'ml',
        imperial_quantity: 2,
        imperial_unit: 'cups'
      },
      {
        name: 'eggs',
        metric_quantity: 2,
        metric_unit: 'whole',
        imperial_quantity: 2,
        imperial_unit: 'whole'
      },
      {
        name: 'sugar',
        metric_quantity: 50,
        metric_unit: 'g',
        imperial_quantity: 0.25,
        imperial_unit: 'cups'
      },
      {
        name: 'vanilla extract',
        metric_quantity: 5,
        metric_unit: 'ml',
        imperial_quantity: 1,
        imperial_unit: 'tsp'
      }
    ];

    const instructions = [
      { step_number: 1, text: 'Mix dry ingredients' },
      { step_number: 2, text: 'Add wet ingredients' },
      { step_number: 3, text: 'Cook on griddle' }
    ];

    const { data: version, error: versionError } = await supabase
      .from('recipe_versions')
      .upsert({
        id: TEST_RECIPE_VERSION_ID,
        recipe_id: TEST_RECIPE_ID,
        version_number: 1,
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        ingredients,
        instructions,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (versionError) {
      console.error('❌ Error creating recipe version:', versionError);
      throw versionError;
    }
    console.log('✅ Recipe version created successfully\n');

    // 3. Set as active version
    console.log('Setting as active version...');
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ active_version_id: TEST_RECIPE_VERSION_ID })
      .eq('id', TEST_RECIPE_ID);

    if (updateError) {
      console.error('❌ Error setting active version:', updateError);
      throw updateError;
    }
    console.log('✅ Active version set successfully\n');

    // 4. Delete existing test pantry items to avoid duplicates
    console.log('Cleaning up existing pantry items...');
    const { error: deleteError } = await supabase
      .from('pantry_items')
      .delete()
      .eq('user_id', TEST_USER_ID)
      .in('name', ['flour', 'milk', 'eggs', 'sugar', 'vanilla extract', 'butter']);

    if (deleteError) {
      console.error('⚠️ Warning: Could not delete existing items:', deleteError);
    } else {
      console.log('✅ Existing pantry items cleaned up\n');
    }

    // 5. Create pantry items with sufficient quantities
    console.log('Creating pantry items with sufficient quantities...');
    const pantryItems = [
      {
        user_id: TEST_USER_ID,
        name: 'flour',
        quantity: 1000,
        unit: 'g',
        category: 'pantry',
        typical_quantity: 1000,
      },
      {
        user_id: TEST_USER_ID,
        name: 'milk',
        quantity: 1500,
        unit: 'ml',
        category: 'dairy',
        typical_quantity: 2000,
      },
      {
        user_id: TEST_USER_ID,
        name: 'eggs',
        quantity: 12,
        unit: 'whole',
        category: 'dairy',
        typical_quantity: 12,
      },
      {
        user_id: TEST_USER_ID,
        name: 'sugar',
        quantity: 200,
        unit: 'g',
        category: 'pantry',
        typical_quantity: 500,
      },
      {
        user_id: TEST_USER_ID,
        name: 'vanilla extract',
        quantity: 50,
        unit: 'ml',
        category: 'pantry',
        typical_quantity: 50,
      },
      {
        user_id: TEST_USER_ID,
        name: 'butter',
        quantity: 50,
        unit: 'g',
        category: 'dairy',
        typical_quantity: 200,
      },
    ];

    const { data: pantryData, error: pantryError } = await supabase
      .from('pantry_items')
      .insert(pantryItems)
      .select();

    if (pantryError) {
      console.error('❌ Error creating pantry items:', pantryError);
      throw pantryError;
    }
    console.log(`✅ Created ${pantryData.length} pantry items\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Test data seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Test Data Summary:');
    console.log('  Recipe: "Test Pancakes" (4 servings)');
    console.log('  Ingredients: 5 items');
    console.log('    - flour: 250g per serving');
    console.log('    - milk: 500ml per serving');
    console.log('    - eggs: 2 whole per serving');
    console.log('    - sugar: 50g per serving');
    console.log('    - vanilla extract: 5ml per serving');
    console.log('\n  Pantry Items: 6 items with sufficient quantities');
    console.log('    - flour: 1000g (enough for 4x recipe)');
    console.log('    - milk: 1500ml (enough for 3x recipe)');
    console.log('    - eggs: 12 whole (enough for 6x recipe)');
    console.log('    - sugar: 200g (enough for 4x recipe)');
    console.log('    - vanilla extract: 50ml (enough for 10x recipe)');
    console.log('    - butter: 50g (for additional testing)');
    console.log('\n🎯 Ready for testing!');
    console.log('   Login: test@example.com / password123');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seed
seedTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
