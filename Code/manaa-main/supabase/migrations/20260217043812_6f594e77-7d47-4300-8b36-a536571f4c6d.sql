
-- Add missing UPDATE policy for categories
CREATE POLICY "Users can update own categories"
ON public.categories
FOR UPDATE
USING (auth.uid() = user_id);

-- Add missing UPDATE policy for stock_movements
CREATE POLICY "Users can update own stock movements"
ON public.stock_movements
FOR UPDATE
USING (is_inventory_owner(inventory_item_id));

-- Add missing UPDATE policy for user_roles (admin only)
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
