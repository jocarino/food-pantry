-- Migration: Shopping List Enhancements
-- Date: 2026-02-27
-- Description: Adds missing columns for suggested quantities, shared_by_user_id, and creates purchase_history table

-- ========================================
-- Add suggested_quantity and suggested_unit to shopping_list_items
-- ========================================
ALTER TABLE shopping_list_items 
ADD COLUMN IF NOT EXISTS suggested_quantity DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS suggested_unit TEXT;

-- Migrate existing quantity/unit data to suggested fields
UPDATE shopping_list_items 
SET suggested_quantity = quantity,
    suggested_unit = unit
WHERE suggested_quantity IS NULL 
  AND quantity IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN shopping_list_items.suggested_quantity IS 'Quantity to suggest when adding item to pantry (not displayed in list)';
COMMENT ON COLUMN shopping_list_items.suggested_unit IS 'Unit to suggest when adding item to pantry (not displayed in list)';

-- ========================================
-- Add shared_by_user_id to shared_lists
-- ========================================
ALTER TABLE shared_lists 
ADD COLUMN IF NOT EXISTS shared_by_user_id UUID REFERENCES auth.users(id);

-- Set existing shared lists to have list owner as sharer
UPDATE shared_lists sl
SET shared_by_user_id = (
  SELECT user_id 
  FROM shopping_lists 
  WHERE id = sl.list_id
)
WHERE shared_by_user_id IS NULL;

-- Add NOT NULL constraint after backfilling
ALTER TABLE shared_lists 
ALTER COLUMN shared_by_user_id SET NOT NULL;

-- Add comment
COMMENT ON COLUMN shared_lists.shared_by_user_id IS 'User who shared the list';

-- ========================================
-- Create purchase_history table
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2),
  unit TEXT,
  category TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  shopping_list_item_id UUID REFERENCES shopping_list_items(id) ON DELETE SET NULL,
  reverted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_history_user_id ON purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_item_name ON purchase_history(user_id, LOWER(item_name));
CREATE INDEX IF NOT EXISTS idx_purchase_history_purchased_at ON purchase_history(user_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_history_reverted ON purchase_history(user_id, reverted_at) WHERE reverted_at IS NULL;

-- Add comments
COMMENT ON TABLE purchase_history IS 'Tracks items purchased from shopping lists for analytics and autocomplete';
COMMENT ON COLUMN purchase_history.reverted_at IS 'When item was unchecked (if applicable)';

-- ========================================
-- RLS Policies for purchase_history
-- ========================================
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchase history
CREATE POLICY "Users can view their own purchase history"
  ON purchase_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own purchase history
CREATE POLICY "Users can insert their own purchase history"
  ON purchase_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own purchase history (for reverts)
CREATE POLICY "Users can update their own purchase history"
  ON purchase_history FOR UPDATE
  USING (auth.uid() = user_id);

-- ========================================
-- Create function to get autocomplete suggestions
-- ========================================
CREATE OR REPLACE FUNCTION get_item_suggestions(
  p_user_id UUID,
  p_search_text TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  item_name TEXT,
  source_type TEXT,
  frequency_count BIGINT,
  last_purchased_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  -- Get suggestions from purchase history
  SELECT 
    ph.item_name,
    'purchase_history'::TEXT AS source_type,
    COUNT(*)::BIGINT AS frequency_count,
    MAX(ph.purchased_at) AS last_purchased_at
  FROM purchase_history ph
  WHERE ph.user_id = p_user_id
    AND ph.reverted_at IS NULL
    AND LOWER(ph.item_name) LIKE LOWER(p_search_text || '%')
  GROUP BY ph.item_name
  
  UNION ALL
  
  -- Get suggestions from pantry items
  SELECT 
    pi.name AS item_name,
    'pantry'::TEXT AS source_type,
    0::BIGINT AS frequency_count,
    NULL::TIMESTAMP WITH TIME ZONE AS last_purchased_at
  FROM pantry_items pi
  WHERE pi.user_id = p_user_id
    AND LOWER(pi.name) LIKE LOWER(p_search_text || '%')
  
  ORDER BY frequency_count DESC, last_purchased_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_item_suggestions(UUID, TEXT, INT) TO authenticated;

-- ========================================
-- Create function to check for duplicate items
-- ========================================
CREATE OR REPLACE FUNCTION check_duplicate_shopping_item(
  p_list_id UUID,
  p_item_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM shopping_list_items 
    WHERE list_id = p_list_id 
      AND LOWER(TRIM(name)) = LOWER(TRIM(p_item_name))
      AND checked = FALSE
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_duplicate_shopping_item(UUID, TEXT) TO authenticated;

-- ========================================
-- Create function to get purchase history suggestions for item
-- ========================================
CREATE OR REPLACE FUNCTION get_purchase_history_for_item(
  p_user_id UUID,
  p_item_name TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  quantity DECIMAL(10,2),
  unit TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE,
  frequency BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH quantity_groups AS (
    SELECT 
      ph.quantity,
      ph.unit,
      MAX(ph.purchased_at) AS last_purchased,
      COUNT(*) AS freq
    FROM purchase_history ph
    WHERE ph.user_id = p_user_id
      AND LOWER(TRIM(ph.item_name)) = LOWER(TRIM(p_item_name))
      AND ph.reverted_at IS NULL
      AND ph.quantity IS NOT NULL
      AND ph.unit IS NOT NULL
    GROUP BY ph.quantity, ph.unit
  )
  SELECT 
    qg.quantity,
    qg.unit,
    qg.last_purchased AS purchased_at,
    qg.freq AS frequency
  FROM quantity_groups qg
  ORDER BY qg.freq DESC, qg.last_purchased DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_purchase_history_for_item(UUID, TEXT, INT) TO authenticated;

-- ========================================
-- Update auto_add_low_stock_to_shopping_list to use suggested fields
-- ========================================
-- Drop old version first (return type changed from INT to TABLE)
DROP FUNCTION IF EXISTS auto_add_low_stock_to_shopping_list(UUID);
CREATE OR REPLACE FUNCTION auto_add_low_stock_to_shopping_list(p_user_id UUID)
RETURNS TABLE (items_added INT) AS $$
DECLARE
  v_list_id UUID;
  v_item_record RECORD;
  v_threshold_percent DECIMAL(5,2);
  v_items_added INT := 0;
BEGIN
  -- Get user's low stock threshold
  SELECT low_stock_threshold_percent INTO v_threshold_percent
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Default to 20% if not set
  IF v_threshold_percent IS NULL THEN
    v_threshold_percent := 20.0;
  END IF;

  -- Get user's first active shopping list or create one
  SELECT id INTO v_list_id
  FROM shopping_lists
  WHERE user_id = p_user_id AND is_archived = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_list_id IS NULL THEN
    INSERT INTO shopping_lists (user_id, name)
    VALUES (p_user_id, 'Shopping List')
    RETURNING id INTO v_list_id;
  END IF;

  -- Find low stock items and add them to shopping list
  FOR v_item_record IN
    SELECT 
      pi.name,
      pi.quantity AS current_quantity,
      pi.typical_quantity,
      pi.unit,
      pi.category,
      (pi.typical_quantity - pi.quantity) AS needed_quantity
    FROM pantry_items pi
    WHERE pi.user_id = p_user_id
      AND pi.quantity < (pi.typical_quantity * (v_threshold_percent / 100))
      AND NOT EXISTS (
        SELECT 1 
        FROM shopping_list_items sli
        WHERE sli.list_id = v_list_id
          AND LOWER(TRIM(sli.name)) = LOWER(TRIM(pi.name))
          AND sli.checked = FALSE
      )
  LOOP
    -- Insert into shopping list with suggested quantities
    INSERT INTO shopping_list_items (
      list_id,
      name,
      source,
      source_label,
      suggested_quantity,
      suggested_unit,
      category,
      checked
    ) VALUES (
      v_list_id,
      v_item_record.name,
      'pantry_alert',
      'Low Stock',
      v_item_record.needed_quantity,
      v_item_record.unit,
      v_item_record.category,
      FALSE
    );

    -- Create low stock alert
    INSERT INTO low_stock_alerts (
      user_id,
      pantry_item_id,
      item_name,
      current_quantity,
      typical_quantity,
      unit,
      alert_type,
      resolved
    ) VALUES (
      p_user_id,
      (SELECT id FROM pantry_items WHERE user_id = p_user_id AND name = v_item_record.name LIMIT 1),
      v_item_record.name,
      v_item_record.current_quantity,
      v_item_record.typical_quantity,
      v_item_record.unit,
      'low_stock',
      FALSE
    )
    ON CONFLICT DO NOTHING;

    v_items_added := v_items_added + 1;
  END LOOP;

  RETURN QUERY SELECT v_items_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Create trigger for updated_at on purchase_history
-- ========================================
CREATE OR REPLACE FUNCTION update_purchase_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_history_updated_at
  BEFORE UPDATE ON purchase_history
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_history_timestamp();

-- ========================================
-- Migration complete
-- ========================================
