/*
  # Add premium activation date tracking

  1. New Columns
    - Add `premium_activated_at` column to `profiles` table
      - `premium_activated_at` (timestamptz, nullable) - tracks when user became premium

  2. Changes
    - Adds index for better query performance on premium activation date
    - Updates existing premium users to set their activation date to their created_at date (migration fallback)

  3. Notes
    - This field will be set when a user's premium status is activated
    - Existing premium users will have their activation date set to their account creation date as fallback
    - New premium activations will use the actual approval timestamp
*/

-- Add the premium_activated_at column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'premium_activated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN premium_activated_at timestamptz;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_premium_activated_at ON profiles(premium_activated_at);

-- For existing premium users, set their premium_activated_at to their created_at date as fallback
UPDATE profiles 
SET premium_activated_at = created_at 
WHERE is_premium = true AND premium_activated_at IS NULL;