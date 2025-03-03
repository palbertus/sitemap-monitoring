/*
  # Create monitoring tables

  1. New Tables
    - `monitors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `url` (text)
      - `enabled` (boolean)
      - `check_interval` (integer, minutes)
      - `last_check` (timestamptz)
      - `created_at` (timestamptz)

    - `url_snapshots`
      - `id` (uuid, primary key)
      - `monitor_id` (uuid, references monitors)
      - `urls` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create monitors table
CREATE TABLE IF NOT EXISTS monitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  url text NOT NULL,
  enabled boolean DEFAULT true,
  check_interval integer DEFAULT 1440, -- 24 hours in minutes
  last_check timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create url_snapshots table
CREATE TABLE IF NOT EXISTS url_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid REFERENCES monitors ON DELETE CASCADE NOT NULL,
  urls jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies for monitors table
CREATE POLICY "Users can create their own monitors"
  ON monitors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own monitors"
  ON monitors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitors"
  ON monitors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitors"
  ON monitors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for url_snapshots table
CREATE POLICY "Users can view their monitors' snapshots"
  ON url_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monitors
      WHERE monitors.id = url_snapshots.monitor_id
      AND monitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create snapshots for their monitors"
  ON url_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM monitors
      WHERE monitors.id = url_snapshots.monitor_id
      AND monitors.user_id = auth.uid()
    )
  );