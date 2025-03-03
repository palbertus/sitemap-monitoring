/*
  # Add next_check field for cron support

  1. Changes
    - Create function to calculate next check time
    - Add next_check field to monitors table
    - Set up trigger to automatically update next_check
    - Update existing records
*/

-- Create function to calculate next check time
CREATE OR REPLACE FUNCTION calculate_next_check(check_interval integer)
RETURNS timestamptz AS $$
BEGIN
  RETURN now() + (check_interval * interval '1 minute');
END;
$$ LANGUAGE plpgsql;

-- Add next_check field with basic default
ALTER TABLE monitors 
ADD COLUMN IF NOT EXISTS next_check timestamptz 
DEFAULT now();

-- Create trigger function to set next_check on insert/update
CREATE OR REPLACE FUNCTION set_next_check()
RETURNS trigger AS $$
BEGIN
  NEW.next_check := calculate_next_check(NEW.check_interval);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_next_check_trigger ON monitors;
CREATE TRIGGER set_next_check_trigger
  BEFORE INSERT OR UPDATE OF check_interval
  ON monitors
  FOR EACH ROW
  EXECUTE FUNCTION set_next_check();

-- Update existing records
UPDATE monitors 
SET next_check = calculate_next_check(check_interval)
WHERE next_check <= now();