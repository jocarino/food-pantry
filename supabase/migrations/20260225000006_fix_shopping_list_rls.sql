-- Migration 6: Fix Shopping List RLS Policies
-- Fixes infinite recursion in shopping list policies by simplifying them

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own and shared shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can view items in accessible lists" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can update items in lists with edit permission" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can delete items in lists with edit permission" ON shopping_list_items;

-- Recreate shopping_lists SELECT policy without recursion
CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Shared list viewing will be handled via a join in the application layer
-- or via a separate query. This prevents the circular dependency that causes
-- infinite recursion between shopping_lists and shared_lists policies.

-- Recreate shopping_list_items SELECT policy (simplified)
CREATE POLICY "Users can view items in own lists"
  ON shopping_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

-- Recreate shopping_list_items UPDATE policy (simplified)
CREATE POLICY "Users can update items in own lists"
  ON shopping_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

-- Recreate shopping_list_items DELETE policy (simplified)
CREATE POLICY "Users can delete items in own lists"
  ON shopping_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

-- Add comment explaining the change
COMMENT ON TABLE shopping_lists IS 'User shopping lists - RLS simplified to prevent recursion with shared_lists';
