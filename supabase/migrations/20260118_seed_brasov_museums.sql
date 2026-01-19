-- Seed Brasov Museums from PDF (Corrected V6)
-- Description: Adds 11 museums/attractions to the businesses table with local images.
-- Fix V6: Using local images mapped from user directory.
-- Images are stored in /public/images/brasov/museum_XX.jpg

DO $$
DECLARE
    v_city_id UUID;
    v_owner_id UUID;
BEGIN
    -- 1. Get City ID for Brasov
    SELECT id INTO v_city_id FROM cities WHERE name = 'Brașov' OR name = 'Brasov' LIMIT 1;
    
    IF v_city_id IS NULL THEN
        v_city_id := gen_random_uuid();
        INSERT INTO cities (id, name, country_code, image_url, description)
        VALUES (v_city_id, 'Brașov', 'RO', 'https://images.unsplash.com/photo-1588667823565-373302b11910', 'Orasul de la poalele Tampei');
    END IF;

    -- 2. Get a valid Owner ID
    SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
    
    IF v_owner_id IS NULL THEN
         RAISE EXCEPTION 'No users found in auth.users. Please create at least one user account.';
    END IF;

    -- 3. Cleanup & Insert Businesses with Local Images
    
    -- Cleanup: Remove existing entries to allow re-seeding without duplicates
    DELETE FROM businesses 
    WHERE city_id = v_city_id 
    AND name IN (
        'Muzeul de Etnografie Brașov',
        'Muzeul Civilizației Urbane a Brașovului',
        'Biserica Neagră',
        'Muzeul Județean de Istorie (Casa Sfatului)',
        'Bastionul Țesătorilor',
        'Parcul Alpin Magic Land',
        'Muzeul Casa Mureșenilor',
        'Muzeul Casa Ștefan Baciu',
        'Muzeul de Artă Brașov',
        'Prima Școală Românească',
        'Olimpia - Muzeul Sportului și Turismului Montan'
    );

    -- 1. Muzeul de Etnografie Brasov
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Muzeul de Etnografie Brașov',
        'Muzeul de Etnografie Braşov este consacrat etnologiei regionale din sud-estul Transilvaniei, ilustrând prin patrimoniul său valoros civilizaţia comunităţii rurale din zonele etnografice Bran, Rupea, Ţara Oltului, Valea Hârtibaciului, Ţara Bârsei. Muzeul s-a înființat în anul 1990, continuând activitatea secției de etnografie (înființată în 1967) din cadrul Muzeului Regional Brașov.

🔗 Bilete: https://booktes.com/cumpara/muzeul-de-etnografie-brasov#2021-04-26',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Museum',
            'price_level', '€',
            'address', 'Bulevardul Eroilor nr. 21A, Brașov',
            'latitude', 45.6450043,
            'longitude', 25.5934601,
            'image_url', '/images/brasov/muzeul_de_etnografie_brasov.jpg',
            'ticket_url', 'https://booktes.com/cumpara/muzeul-de-etnografie-brasov#2021-04-26',
            'rating', 4.8,
            'is_verified', true
        )
    );

    -- 2. Muzeul Civilizatiei Urbane a Brasovului
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Muzeul Civilizației Urbane a Brașovului',
        'Muzeul Civilizaţiei Urbane a Braşovului funcţionează într-un important monument de arhitectură civilă, reprezentativ pentru tipologia spaţiului comercial și de locuit privat, din oraşele transilvănene, între secolele al XVI-lea şi al XIX-lea. Muzeul a fost inaugurat în anul 2009.

🔗 Bilete: https://booktes.com/cumpara/muzeul-civilizatiei-urbane-a-brasovului',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Museum',
            'price_level', '€',
            'address', 'Piața Sfatului nr. 15, Brașov',
            'latitude', 45.64238,
            'longitude', 25.58893,
            'image_url', '/images/brasov/muzeul_civilizatiei_urbane_a_brasovului.jpg',
            'ticket_url', 'https://booktes.com/cumpara/muzeul-civilizatiei-urbane-a-brasovului',
            'rating', 4.7,
            'is_verified', true
        )
    );

    -- 3. Biserica Neagră
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Biserica Neagră',
        'Cine a fost la Brașov știe că Biserica Neagră este simbolul orașului. O construcție impozantă și impresionantă, sursă continuă de inspirație și încântare. Cel mai mare edificiu de cult în stil gotic din sud-estul Europei.

🔗 Bilete: https://booktes.com/cumpara/biserica-neagra',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Landmark',
            'price_level', '€',
            'address', 'Curtea Johannes Honterus, nr. 2, Brașov',
            'latitude', 45.6410,
            'longitude', 25.5880,
            'image_url', '/images/brasov/biserica_neagra.jpg',
            'ticket_url', 'https://booktes.com/cumpara/biserica-neagra',
            'rating', 4.9,
            'is_verified', true
        )
    );

    -- 4. Muzeul Judetean de Istorie Brasov (Casa Sfatului)
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Muzeul Județean de Istorie (Casa Sfatului)',
        'Muzeul Județean de Istorie Brașov este între cele mai importante instituții culturale publice ale județului Brașov. Deține cel mai mare patrimoniu istoric mobil al județului Brașov (159.255 piese), acoperind toate epocile istorice.

🔗 Bilete: https://booktes.com/cumpara/muzeul-judetean-de-istorie-brasov',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Museum',
            'price_level', '€',
            'address', 'Piața Sfatului, nr. 30, Brașov',
            'latitude', 45.6424,
            'longitude', 25.5889,
            'image_url', '/images/brasov/muzeul_judetean_de_istorie_brasov.jpg',
            'ticket_url', 'https://booktes.com/cumpara/muzeul-judetean-de-istorie-brasov',
            'rating', 4.6,
            'is_verified', true
        )
    );

    -- 5. Bastionul Tesatorilor
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Bastionul Țesătorilor',
        'Turnul apărat şi întreţinut de bresla ţesătorilor de in a fost construit în două etape, între anii 1421 – 1436 şi 1570 – 1573. O capodoperă a arhitecturii militare medievale, cu mecanisme de apărare inedite.

🔗 Bilete: https://booktes.com/cumpara/bastionul-tesatorilor',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Historic Site',
            'price_level', '€',
            'address', 'Strada George Coșbuc, nr. 9, Brașov',
            'latitude', 45.6369,
            'longitude', 25.5889,
            'image_url', '/images/brasov/bastionul_tesatorilor.jpg',
            'ticket_url', 'https://booktes.com/cumpara/bastionul-tesatorilor',
            'rating', 4.5,
            'is_verified', true
        )
    );

    -- 6. Parcul Alpin Magic Land (Poiana Brasov)
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Parcul Alpin Magic Land',
        'Într-o zi cum nu a mai fost pe acest pământ, asupra meleagului se așternuseră pături întunecate... Un parc tematic în Poiana Brașov, inspirat din legende și magie.

🔗 Bilete: https://booktes.com/cumpara/parcul-alpin-magic-land#2021-07-12',
        'Nature',
        v_city_id,
        v_owner_id,
        'nature_spot',
        jsonb_build_object(
            'subcategory', 'Amusement Park',
            'price_level', '€€',
            'address', 'Poiana Brașov',
            'latitude', 45.5963,
            'longitude', 25.5513,
            'image_url', '/images/brasov/parcul_alpin_magic_land.jpg',
            'ticket_url', 'https://booktes.com/cumpara/parcul-alpin-magic-land#2021-07-12',
            'rating', 4.8,
            'is_verified', true
        )
    );

    -- 7. Muzeul Casa Muresenilor Brasov
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Muzeul Casa Mureșenilor',
        '„Casa Mureșenilor” s-a deschis în anul 1968, ca urmare a donaţiei făcute de urmaşii familiei Mureşianu, și funcționează într-una dintre cele mai vechi construcții în stil gotic din Piața Sfatului.

🔗 Bilete: https://booktes.com/cumpara/muzeul-casa-muresenilor-brasov',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Museum',
            'price_level', '€',
            'address', 'Piața Sfatului, nr. 25, Brașov',
            'latitude', 45.6425,
            'longitude', 25.5890,
            'image_url', '/images/brasov/muzeul_casa_muresenilor_brasov.jpg',
            'ticket_url', 'https://booktes.com/cumpara/muzeul-casa-muresenilor-brasov',
            'rating', 4.5,
            'is_verified', true
        )
    );

    -- 8. Muzeul Casa Stefan Baciu Brasov
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Muzeul Casa Ștefan Baciu',
        '„Casa Ștefan Baciu”, sau Casa Galbenă, este situată în zona istorică a Brașovului, în apropierea Porții Schei. Memorial dedicat poetului și publicistului Ștefan Baciu.

🔗 Bilete: https://booktes.com/cumpara/muzeul-casa-stefan-baciu-brasov',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Museum',
            'price_level', '€',
            'address', 'Strada Doctor Gheorghe Baiulescu, nr. 9, Brașov',
            'latitude', 45.6377,
            'longitude', 25.5864,
            'image_url', '/images/brasov/muzeul_casa_stefan_baciu_brasov.jpg',
            'ticket_url', 'https://booktes.com/cumpara/muzeul-casa-stefan-baciu-brasov',
            'rating', 4.4,
            'is_verified', true
        )
    );

    -- 9. Muzeul de Arta Brasov
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Muzeul de Artă Brașov',
        'O clădire construită în 1902 pe Bulevardul Eroilor nr.21, reprezentantă a stilului neobaroc, găzduiește în prezent Muzeul de Artă Brașov. Galeria Națională reunește lucrări reprezentative pentru arta plastică din spaţiul românesc.

🔗 Bilete: https://booktes.com/cumpara/muzeul-de-arta-brasov',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Art Gallery',
            'price_level', '€',
            'address', 'Bulevardul Eroilor, nr. 21, Brașov',
            'latitude', 45.6423,
            'longitude', 25.5889,
            'image_url', '/images/brasov/muzeul_de_arta.jpg',
            'ticket_url', 'https://booktes.com/cumpara/muzeul-de-arta-brasov',
            'rating', 4.7,
            'is_verified', true
        )
    );

    -- 10. Muzeul Prima Scoala Romaneasca
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Prima Școală Românească',
        'Biserica Sf. Nicolae din Șchei, reprezintă creuzetul de formare a ideii de românism, casa limbii române și casa imnului național. Locul unde s-au ținut primele cursuri în limba română (1583).

🔗 Bilete: https://booktes.com/cumpara/prima-scoala-romaneasca',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'History',
            'price_level', '€',
            'address', 'Piața Unirii, nr. 2-3, Brașov',
            'latitude', 45.6358,
            'longitude', 25.5812,
            'image_url', '/images/brasov/muzeul_prima_scoala.jpg',
            'ticket_url', 'https://booktes.com/cumpara/prima-scoala-romaneasca',
            'rating', 4.9,
            'is_verified', true
        )
    );

     -- 11. Olimpia - Muzeul Sportului
    INSERT INTO businesses (name, description, category, city_id, owner_user_id, type, attributes)
    VALUES (
        'Olimpia - Muzeul Sportului și Turismului Montan',
        'OLIMPIA - Primul muzeu al sportului și turismului montan din România. Proiect de cercetare curatorială și valorificare a patrimoniului sportiv brașovean.

🔗 Bilete: https://booktes.com/cumpara/olimpia-muzeul-sportului-si-turismului-montan',
        'Activities',
        v_city_id,
        v_owner_id,
        'activity',
        jsonb_build_object(
            'subcategory', 'Museum',
            'price_level', '€',
            'address', 'Strada George Coșbuc, nr. 2, Brașov',
            'latitude', 45.6400,
            'longitude', 25.5900,
            'image_url', '/images/brasov/muzeul_sportului.jpg',
            'ticket_url', 'https://booktes.com/cumpara/olimpia-muzeul-sportului-si-turismului-montan',
            'rating', 4.6,
            'is_verified', true
        )
    );

END $$;
