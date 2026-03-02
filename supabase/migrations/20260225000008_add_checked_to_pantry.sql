-- =====================================================
-- FUNCTION: Add checked shopping list items to pantry
-- =====================================================
CREATE OR REPLACE FUNCTION add_checked_items_to_pantry(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_item RECORD;
  v_count INT := 0;
  v_pantry_item_id UUID;
BEGIN
  -- Loop through all checked items for this user
  FOR v_item IN 
    SELECT sli.id, sli.name, sli.quantity, sli.unit, sli.category
    FROM shopping_list_items sli
    JOIN shopping_lists sl ON sl.id = sli.list_id
    WHERE sl.user_id = p_user_id
      AND sli.checked = true
      AND sli.quantity IS NOT NULL
  LOOP
    -- Check if item already exists in pantry (case-insensitive match)
    SELECT id INTO v_pantry_item_id
    FROM pantry_items
    WHERE user_id = p_user_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(v_item.name))
    LIMIT 1;
    
    IF v_pantry_item_id IS NOT NULL THEN
      -- Item exists, add to existing quantity
      UPDATE pantry_items
      SET quantity = quantity + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_pantry_item_id;
      
      -- Log the addition
      INSERT INTO pantry_usage_history (
        pantry_item_id,
        quantity_change,
        reason
      ) VALUES (
        v_pantry_item_id,
        v_item.quantity,
        'shopping_list_purchased'
      );
    ELSE
      -- Item doesn't exist, create new pantry item
      INSERT INTO pantry_items (
        user_id,
        name,
        quantity,
        unit,
        category,
        typical_quantity
      ) VALUES (
        p_user_id,
        v_item.name,
        v_item.quantity,
        v_item.unit,
        v_item.category,
        v_item.quantity  -- Set typical_quantity to purchased amount
      )
      RETURNING id INTO v_pantry_item_id;
      
      -- Log the addition
      INSERT INTO pantry_usage_history (
        pantry_item_id,
        quantity_change,
        reason
      ) VALUES (
        v_pantry_item_id,
        v_item.quantity,
        'shopping_list_purchased'
      );
    END IF;
    
    -- Delete the shopping list item after adding to pantry
    DELETE FROM shopping_list_items WHERE id = v_item.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_checked_items_to_pantry(UUID) IS 'Adds all checked shopping list items to pantry and removes them from list';
