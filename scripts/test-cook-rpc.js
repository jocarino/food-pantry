#!/usr/bin/env node
/**
 * Manual RPC Test Script
 * Tests the deduct_recipe_from_pantry RPC function directly
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_RECIPE_VERSION_ID = '10000000-0000-0000-0000-000000000002';

async function testCookRPC() {
  console.log('🧪 Testing deduct_recipe_from_pantry RPC function\n');

  try {
    // 1. Check pantry before cooking
    console.log('📦 Checking pantry quantities BEFORE cooking...');
    const { data: beforePantry, error: beforeError } = await supabase
      .from('pantry_items')
      .select('name, quantity, unit')
      .eq('user_id', TEST_USER_ID)
      .in('name', ['flour', 'milk', 'eggs', 'sugar', 'vanilla extract'])
      .order('name');

    if (beforeError) {
      console.error('❌ Error fetching pantry:', beforeError);
      throw beforeError;
    }

    console.log('BEFORE:');
    beforePantry.forEach(item => {
      console.log(`  - ${item.name}: ${item.quantity} ${item.unit}`);
    });
    console.log('');

    // 2. Call the RPC function to cook the recipe (x1 serving)
    console.log('🍳 Calling deduct_recipe_from_pantry RPC...');
    console.log(`   User ID: ${TEST_USER_ID}`);
    console.log(`   Recipe Version ID: ${TEST_RECIPE_VERSION_ID}`);
    console.log(`   Servings: 1\n`);

    const { data: result, error: rpcError } = await supabase.rpc('deduct_recipe_from_pantry', {
      p_user_id: TEST_USER_ID,
      p_recipe_version_id: TEST_RECIPE_VERSION_ID,
      p_servings: 1,
    });

    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
      throw rpcError;
    }

    console.log('✅ RPC call successful!\n');
    console.log('📊 RPC Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    // 3. Check pantry after cooking
    console.log('📦 Checking pantry quantities AFTER cooking...');
    const { data: afterPantry, error: afterError } = await supabase
      .from('pantry_items')
      .select('name, quantity, unit')
      .eq('user_id', TEST_USER_ID)
      .in('name', ['flour', 'milk', 'eggs', 'sugar', 'vanilla extract'])
      .order('name');

    if (afterError) {
      console.error('❌ Error fetching pantry:', afterError);
      throw afterError;
    }

    console.log('AFTER:');
    afterPantry.forEach(item => {
      console.log(`  - ${item.name}: ${item.quantity} ${item.unit}`);
    });
    console.log('');

    // 4. Calculate and display changes
    console.log('📉 Changes:');
    beforePantry.forEach(beforeItem => {
      const afterItem = afterPantry.find(a => a.name === beforeItem.name);
      if (afterItem) {
        const change = afterItem.quantity - beforeItem.quantity;
        const changeStr = change < 0 ? `${change}` : `+${change}`;
        console.log(`  - ${beforeItem.name}: ${beforeItem.quantity} → ${afterItem.quantity} (${changeStr} ${beforeItem.unit})`);
      }
    });
    console.log('');

    // 5. Analyze results
    const deductedCount = result.deducted?.length || 0;
    const missingCount = result.needs_confirmation?.length || 0;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Deducted ingredients: ${deductedCount}`);
    console.log(`⚠️  Missing ingredients: ${missingCount}`);

    if (missingCount > 0) {
      console.log('\nMissing ingredients:');
      result.needs_confirmation.forEach(item => {
        console.log(`  - ${item.ingredient_name}: ${item.quantity} ${item.unit}`);
      });
    }

    // 6. Verify expected behavior
    console.log('\n🔍 Verification:');
    const expectedDeductions = {
      flour: 250,    // g
      milk: 500,     // ml
      eggs: 2,       // whole
      sugar: 50,     // g
      'vanilla extract': 5  // ml
    };

    let allCorrect = true;
    beforePantry.forEach(beforeItem => {
      const afterItem = afterPantry.find(a => a.name === beforeItem.name);
      const expectedDeduction = expectedDeductions[beforeItem.name] || 0;
      const actualDeduction = beforeItem.quantity - afterItem.quantity;
      
      if (Math.abs(actualDeduction - expectedDeduction) < 0.01) {
        console.log(`  ✅ ${beforeItem.name}: Correctly deducted ${actualDeduction} ${beforeItem.unit}`);
      } else {
        console.log(`  ❌ ${beforeItem.name}: Expected -${expectedDeduction}, got -${actualDeduction} ${beforeItem.unit}`);
        allCorrect = false;
      }
    });

    if (allCorrect && deductedCount === 5 && missingCount === 0) {
      console.log('\n🎉 SUCCESS! All ingredients correctly deducted!');
      console.log('   The cook recipe functionality is working as expected.');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some issues detected.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCookRPC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
