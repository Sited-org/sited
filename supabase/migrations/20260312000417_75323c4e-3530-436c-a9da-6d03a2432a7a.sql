-- Remove the public INSERT policy so bookings can only be created via the submit-booking edge function
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;

-- Add admin-only insert policy
CREATE POLICY "Admins can insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));