ALTER TABLE places
ADD COLUMN meal_type VARCHAR CHECK (meal_type IS NULL OR meal_type IN ('breakfast', 'lunch', 'dinner'));
