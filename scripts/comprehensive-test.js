#!/usr/bin/env node
/**
 * Comprehensive Test Script
 * Tests all aspects of the Recipe Pantry Deduction Workflow
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_RECIPE_ID = '10000000-0000-0000-0000-000000000001';
const TEST_RECIPE_VERSION_ID = '10000000-0000-0000-0000-000000000002';

let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ ${testName}`);
    if (details) console.log(`   ${details}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

async function resetPantryQuantities() {
  // Reset pantry to initial quantities
  await supabase.from('pantry_items').update({ quantity: 1000 }).eq('user_id', TEST_USER_ID).eq('name', 'flour');
  await supabase.from('pantry_items').update({ quantity: 1500 }).eq('user_id', TEST_USER_ID).eq('name', 'milk');
  await supabase.from('pantry_items').update({ quantity: 12 }).eq('user_id', TEST_USER_ID).eq('name', 'eggs');
  await supabase.from('pantry_items').update({ quantity: 200 }).eq('user_id', TEST_USER_ID).eq('name', 'sugar');
  await supabase.from('pantry_items').update({ quantity: 50 }).eq('user_id', TEST_USER_ID).eq('name', 'vanilla extract');
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Recipe Pantry Deduction Workflow - Comprehensive Tests ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // ============================================
    // TEST 1: Recipe Data Exists
    // ============================================
    console.log('📋 TEST GROUP 1: Recipe Data Verification\n');
    
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*, recipe_versions(*)')
      .eq('id', TEST_RECIPE_ID)
      .single();

    logTest(
      'TEST 1.1: Recipe "Test Pancakes" exists',
      !recipeError && recipe,
      recipe ? `Found: ${recipe.title}` : 'Recipe not found'
    );

    logTest(
      'TEST 1.2: Recipe has active version',
      recipe?.active_version_id === TEST_RECIPE_VERSION_ID,
      `Active Version ID: ${recipe?.active_version_id}`
    );

    const recipeVersion = recipe?.recipe_versions?.[0];
    logTest(
      'TEST 1.3: Recipe version has 5 ingredients',
      recipeVersion?.ingredients?.length === 5,
      `Found ${recipeVersion?.ingredients?.length} ingredients`
    );

    logTest(
      'TEST 1.4: Recipe version has servings=4',
      recipeVersion?.servings === 4,
      `Servings: ${recipeVersion?.servings}`
    );

    // ============================================
    // TEST 2: Pantry Items Exist
    // ============================================
    console.log('\n📦 TEST GROUP 2: Pantry Items Verification\n');

    const { data: pantryItems } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .in('name', ['flour', 'milk', 'eggs', 'sugar', 'vanilla extract']);

    logTest(
      'TEST 2.1: All 5 pantry items exist',
      pantryItems?.length === 5,
      `Found ${pantryItems?.length} items`
    );

    const flourItem = pantryItems?.find(i => i.name === 'flour');
    logTest(
      'TEST 2.2: Flour has sufficient quantity',
      flourItem?.quantity >= 250,
      `Flour: ${flourItem?.quantity}g (needs 250g)`
    );

    // ============================================
    // TEST 3: Cook Recipe with x1 Servings
    // ============================================
    console.log('\n🍳 TEST GROUP 3: Cook Recipe (x1 Servings)\n');

    await resetPantryQuantities();
    
    const { data: beforePantry1 } = await supabase
      .from('pantry_items')
      .select('name, quantity')
      .eq('user_id', TEST_USER_ID)
      .in('name', ['flour', 'milk', 'eggs', 'sugar', 'vanilla extract']);

    const { data: result1, error: rpc1Error } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 1,
    });

    logTest(
      'TEST 3.1: RPC call succeeds with x1 servings',
      !rpc1Error,
      rpc1Error ? rpc1Error.message : 'RPC successful'
    );

    logTest(
      'TEST 3.2: All 5 ingredients deducted',
      result1?.deducted?.length === 5,
      `Deducted: ${result1?.deducted?.length}, Missing: ${result1?.needs_confirmation?.length}`
    );

    const { data: afterPantry1 } = await supabase
      .from('pantry_items')
      .select('name, quantity')
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'flour')
      .single();

    logTest(
      'TEST 3.3: Flour deducted correctly (1000g → 750g)',
      afterPantry1?.quantity === 750,
      `Flour after: ${afterPantry1?.quantity}g`
    );

    // ============================================
    // TEST 4: Cook Recipe with x2 Servings
    // ============================================
    console.log('\n🍳 TEST GROUP 4: Cook Recipe (x2 Servings)\n');

    await resetPantryQuantities();

    const { data: result2, error: rpc2Error } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 2,
    });

    logTest(
      'TEST 4.1: RPC call succeeds with x2 servings',
      !rpc2Error,
      rpc2Error ? rpc2Error.message : 'RPC successful'
    );

    const { data: afterPantry2 } = await supabase
      .from('pantry_items')
      .select('name, quantity')
      .eq('user_id', TEST_USER_ID)
      .in('name', ['flour', 'eggs']);

    const flour2 = afterPantry2?.find(i => i.name === 'flour');
    const eggs2 = afterPantry2?.find(i => i.name === 'eggs');

    logTest(
      'TEST 4.2: Flour deducted correctly with x2 (1000g → 500g)',
      flour2?.quantity === 500,
      `Flour after: ${flour2?.quantity}g (expected 500g)`
    );

    logTest(
      'TEST 4.3: Eggs deducted correctly with x2 (12 → 8)',
      eggs2?.quantity === 8,
      `Eggs after: ${eggs2?.quantity} (expected 8)`
    );

    // ============================================
    // TEST 5: Cook Recipe with x5 Servings
    // ============================================
    console.log('\n🍳 TEST GROUP 5: Cook Recipe (x5 Servings - High Multiplier)\n');

    await resetPantryQuantities();

    const { data: result5, error: rpc5Error } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 5,
    });

    logTest(
      'TEST 5.1: RPC call succeeds with x5 servings',
      !rpc5Error,
      rpc5Error ? rpc5Error.message : 'RPC successful'
    );

    const { data: afterPantry5 } = await supabase
      .from('pantry_items')
      .select('name, quantity')
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'vanilla extract')
      .single();

    logTest(
      'TEST 5.2: Vanilla extract deducted correctly with x5 (50ml → 25ml)',
      afterPantry5?.quantity === 25,
      `Vanilla after: ${afterPantry5?.quantity}ml (expected 25ml)`
    );

    // ============================================
    // TEST 6: Insufficient Quantity Handling
    // ============================================
    console.log('\n⚠️  TEST GROUP 6: Insufficient Quantity Handling\n');

    // Set flour to only 100g (recipe needs 250g)
    await supabase.from('pantry_items')
      .update({ quantity: 100 })
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'flour');

    const { data: result6 } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 1,
    });

    const { data: flourAfter6 } = await supabase
      .from('pantry_items')
      .select('quantity')
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'flour')
      .single();

    logTest(
      'TEST 6.1: Insufficient quantity goes to 0 (not negative)',
      flourAfter6?.quantity === 0,
      `Flour after: ${flourAfter6?.quantity}g (expected 0g, not -150g)`
    );

    logTest(
      'TEST 6.2: Other ingredients still deducted normally',
      result6?.deducted?.length >= 4,
      `Deducted ${result6?.deducted?.length} ingredients`
    );

    // ============================================
    // TEST 7: Missing Ingredient Handling
    // ============================================
    console.log('\n🔍 TEST GROUP 7: Missing Ingredient Handling\n');

    await resetPantryQuantities();
    
    // Delete vanilla extract from pantry
    await supabase.from('pantry_items')
      .delete()
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'vanilla extract');

    const { data: result7 } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 1,
    });

    logTest(
      'TEST 7.1: RPC succeeds with missing ingredient',
      result7 !== null,
      'RPC returned result'
    );

    logTest(
      'TEST 7.2: Found ingredients are deducted (4 items)',
      result7?.deducted?.length === 4,
      `Deducted: ${result7?.deducted?.length}`
    );

    logTest(
      'TEST 7.3: Missing ingredient in needs_confirmation',
      result7?.needs_confirmation?.length === 1,
      `Missing: ${result7?.needs_confirmation?.[0]?.ingredient_name}`
    );

    // Restore vanilla extract
    await supabase.from('pantry_items').insert({
      user_id: TEST_USER_ID,
      name: 'vanilla extract',
      quantity: 50,
      unit: 'ml',
      category: 'pantry',
      typical_quantity: 50,
    });

    // ============================================
    // TEST 8: Case Insensitive Matching
    // ============================================
    console.log('\n🔤 TEST GROUP 8: Case Insensitive Matching\n');

    await resetPantryQuantities();

    // Update flour to uppercase
    await supabase.from('pantry_items')
      .update({ name: 'FLOUR' })
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'flour');

    const { data: result8 } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 1,
    });

    const flourMatch = result8?.deducted?.find(d => d.ingredient_name === 'flour');

    logTest(
      'TEST 8.1: Case-insensitive match works (FLOUR matches flour)',
      flourMatch !== undefined,
      flourMatch ? `Matched: ${flourMatch.ingredient_name} with FLOUR` : 'No match'
    );

    // Restore flour name
    await supabase.from('pantry_items')
      .update({ name: 'flour' })
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'FLOUR');

    // ============================================
    // TEST 9: Usage History Logging
    // ============================================
    console.log('\n📝 TEST GROUP 9: Usage History Logging\n');

    await resetPantryQuantities();

    // Clear old history
    await supabase.from('pantry_usage_history')
      .delete()
      .eq('recipe_version_id', TEST_RECIPE_VERSION_ID);

    await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 1,
    });

    const { data: history } = await supabase
      .from('pantry_usage_history')
      .select('*')
      .eq('recipe_version_id', TEST_RECIPE_VERSION_ID)
      .eq('reason', 'recipe_cooked');

    logTest(
      'TEST 9.1: Usage history created (5 entries)',
      history?.length === 5,
      `Found ${history?.length} history entries`
    );

    const flourHistory = history?.find(h => 
      h.pantry_item_id && h.quantity_change === -250
    );

    logTest(
      'TEST 9.2: History records negative quantity change',
      flourHistory?.quantity_change === -250,
      `Flour change: ${flourHistory?.quantity_change}`
    );

    logTest(
      'TEST 9.3: History records reason as "recipe_cooked"',
      flourHistory?.reason === 'recipe_cooked',
      `Reason: ${flourHistory?.reason}`
    );

    // ============================================
    // FINAL RESET
    // ============================================
    await resetPantryQuantities();

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error);
    testsFailed++;
  }

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                     TEST SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! The Recipe Pantry Deduction Workflow is working correctly!');
    console.log('   The backend functionality is fully operational.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the failures above.\n');
  }
}

// Run the tests
runTests()
  .then(() => process.exit(testsFailed > 0 ? 1 : 0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
