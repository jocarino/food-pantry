-- Add INSERT policy for shopping_lists table
-- This was missing and causing RLS violations

DO $$ BEGIN
  CREATE POLICY "Users can create own shopping lists"
    ON shopping_lists FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert items in own lists"
    ON shopping_list_items FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM shopping_lists
        WHERE shopping_lists.id = shopping_list_items.list_id
          AND shopping_lists.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
