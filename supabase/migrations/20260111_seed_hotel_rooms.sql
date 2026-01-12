-- Searchnig for businesses categorized as 'Hotel' (case insensitive)
-- and inserting default rooms (Standard, Deluxe, Suite) for them.

DO $$
DECLARE
    business_record RECORD;
BEGIN
    FOR business_record IN 
        SELECT id, name FROM businesses 
        WHERE category ILIKE 'Hotel' OR category ILIKE 'Hotels'
    LOOP
        -- Check if rooms already exist to avoid duplicates (optional, but good practice)
        IF NOT EXISTS (SELECT 1 FROM hotel_rooms WHERE business_id = business_record.id) THEN
            
            -- Insert Standard Room
            INSERT INTO hotel_rooms (business_id, room_type, name, description, price_per_night, max_guests, total_rooms, amenities, images, is_active)
            VALUES (
                business_record.id,
                'Standard',
                'Camera Standard',
                'Cameră confortabilă ideală pentru cupluri sau călători singuri. Include toate facilitățile de bază.',
                250, -- Price RON
                2,   -- Max guests
                10,  -- Total rooms
                ARRAY['Wi-Fi', 'TV', 'Aer condiționat', 'Baie privată', 'Uscător de păr'],
                ARRAY[]::text[],
                true
            );

            -- Insert Deluxe Room
            INSERT INTO hotel_rooms (business_id, room_type, name, description, price_per_night, max_guests, total_rooms, amenities, images, is_active)
            VALUES (
                business_record.id,
                'Deluxe',
                'Camera Deluxe',
                'Spațiu generos cu design modern. Include balcon privat și vedere panoramică.',
                450,
                2,
                5,
                ARRAY['Wi-Fi', 'Smart TV', 'Minibar', 'Balcon', 'Room Service', 'Espressor'],
                ARRAY[]::text[],
                true
            );

            -- Insert Suite
            INSERT INTO hotel_rooms (business_id, room_type, name, description, price_per_night, max_guests, total_rooms, amenities, images, is_active)
            VALUES (
                business_record.id,
                'Suite',
                'Junior Suite',
                'Experiență de lux cu zonă de living separată și facilități premium.',
                800,
                4,
                3,
                ARRAY['Wi-Fi', 'Smart TV', 'Jacuzzi', 'Living', 'Vedere panoramică', 'Mic dejun inclus', 'Acces Spa'],
                ARRAY[]::text[],
                true
            );
            
            RAISE NOTICE 'Seeded rooms for hotel: %', business_record.name;
        END IF;
    END LOOP;
END $$;
