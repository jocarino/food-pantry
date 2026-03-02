-- Fix auto_add_low_stock_to_shopping_list function return type
-- The function was changed from RETURNS INT to RETURNS TABLE, which requires dropping first

DROP FUNCTION IF EXISTS auto_add_low_stock_to_shopping_list(UUID);

-- Now the function from migration 20260227000009 can be applied
-- (This migration just drops the old version, the new version is in migration 009)
