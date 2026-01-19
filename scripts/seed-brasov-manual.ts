
import { createClient } from '@supabase/supabase-js'

async function seed() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Connecting to Supabase...')

    // 1. Get City ID
    const { data: cities, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .or('name.eq.Brașov,name.eq.Brasov')
        .limit(1)

    if (cityError || !cities || cities.length === 0) {
        console.error('City Brasov not found', cityError)
        return
    }

    const cityId = cities[0].id
    console.log('City ID:', cityId)

    // 2. Get Owner ID from PROFILES to ensure FK constraint
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
        console.error('No profiles found', profileError)
        return
    }
    const ownerId = profiles[0].id
    console.log('Owner ID:', ownerId)

    // 3. Data to insert
    const businesses = [
        {
            name: 'Muzeul de Etnografie Brașov',
            description: 'Muzeul de Etnografie Braşov este consacrat etnologiei regionale din sud-estul Transilvaniei, ilustrând prin patrimoniul său valoros civilizaţia comunităţii rurale din zonele etnografice Bran, Rupea, Ţara Oltului, Valea Hârtibaciului, Ţara Bârsei. Muzeul s-a înființat în anul 1990, continuând activitatea secției de etnografie (înființată în 1967) din cadrul Muzeului Regional Brașov.\n\n🔗 Bilete: https://booktes.com/cumpara/muzeul-de-etnografie-brasov#2021-04-26',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Museum',
                price_level: '€',
                address: 'Bulevardul Eroilor nr. 21A, Brașov',
                latitude: 45.6450043,
                longitude: 25.5934601,
                image_url: '/images/brasov/muzeul_de_etnografie_brasov.jpg',
                ticket_url: 'https://booktes.com/cumpara/muzeul-de-etnografie-brasov#2021-04-26',
                rating: 4.8,
                is_verified: true
            }
        },
        {
            name: 'Muzeul Civilizației Urbane a Brașovului',
            description: 'Muzeul Civilizaţiei Urbane a Braşovului funcţionează într-un important monument de arhitectură civilă, reprezentativ pentru tipologia spaţiului comercial și de locuit privat, din oraşele transilvănene, între secolele al XVI-lea şi al XIX-lea. Muzeul a fost inaugurat în anul 2009.\n\n🔗 Bilete: https://booktes.com/cumpara/muzeul-civilizatiei-urbane-a-brasovului',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Museum',
                price_level: '€',
                address: 'Piața Sfatului nr. 15, Brașov',
                latitude: 45.64238,
                longitude: 25.58893,
                image_url: '/images/brasov/muzeul_civilizatiei_urbane_a_brasovului.jpg',
                ticket_url: 'https://booktes.com/cumpara/muzeul-civilizatiei-urbane-a-brasovului',
                rating: 4.7,
                is_verified: true
            }
        },
        {
            name: 'Biserica Neagră',
            description: 'Cine a fost la Brașov știe că Biserica Neagră este simbolul orașului. O construcție impozantă și impresionantă, sursă continuă de inspirație și încântare. Cel mai mare edificiu de cult în stil gotic din sud-estul Europei.\n\n🔗 Bilete: https://booktes.com/cumpara/biserica-neagra',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Landmark',
                price_level: '€',
                address: 'Curtea Johannes Honterus, nr. 2, Brașov',
                latitude: 45.6410,
                longitude: 25.5880,
                image_url: '/images/brasov/biserica_neagra.jpg',
                ticket_url: 'https://booktes.com/cumpara/biserica-neagra',
                rating: 4.9,
                is_verified: true
            }
        },
        {
            name: 'Muzeul Județean de Istorie (Casa Sfatului)',
            description: 'Muzeul Județean de Istorie Brașov este între cele mai importante instituții culturale publice ale județului Brașov. Deține cel mai mare patrimoniu istoric mobil al județului Brașov (159.255 piese), acoperind toate epocile istorice.\n\n🔗 Bilete: https://booktes.com/cumpara/muzeul-judetean-de-istorie-brasov',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Museum',
                price_level: '€',
                address: 'Piața Sfatului, nr. 30, Brașov',
                latitude: 45.6424,
                longitude: 25.5889,
                image_url: '/images/brasov/muzeul_judetean_de_istorie_brasov.jpg',
                ticket_url: 'https://booktes.com/cumpara/muzeul-judetean-de-istorie-brasov',
                rating: 4.6,
                is_verified: true
            }
        },
        {
            name: 'Bastionul Țesătorilor',
            description: 'Turnul apărat şi întreţinut de bresla ţesătorilor de in a fost construit în două etape, între anii 1421 – 1436 şi 1570 – 1573. O capodoperă a arhitecturii militare medievale, cu mecanisme de apărare inedite.\n\n🔗 Bilete: https://booktes.com/cumpara/bastionul-tesatorilor',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Historic Site',
                price_level: '€',
                address: 'Strada George Coșbuc, nr. 9, Brașov',
                latitude: 45.6369,
                longitude: 25.5889,
                image_url: '/images/brasov/bastionul_tesatorilor.jpg',
                ticket_url: 'https://booktes.com/cumpara/bastionul-tesatorilor',
                rating: 4.5,
                is_verified: true
            }
        },
        {
            name: 'Parcul Alpin Magic Land',
            description: 'Într-o zi cum nu a mai fost pe acest pământ, asupra meleagului se așternuseră pături întunecate... Un parc tematic în Poiana Brașov, inspirat din legende și magie.\n\n🔗 Bilete: https://booktes.com/cumpara/parcul-alpin-magic-land#2021-07-12',
            category: 'Nature',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'nature_spot',
            attributes: {
                subcategory: 'Amusement Park',
                price_level: '€€',
                address: 'Poiana Brașov',
                latitude: 45.5963,
                longitude: 25.5513,
                image_url: '/images/brasov/parcul_alpin_magic_land.jpg',
                ticket_url: 'https://booktes.com/cumpara/parcul-alpin-magic-land#2021-07-12',
                rating: 4.8,
                is_verified: true
            }
        },
        {
            name: 'Muzeul Casa Mureșenilor',
            description: '„Casa Mureșenilor” s-a deschis în anul 1968, ca urmare a donaţiei făcute de urmaşii familiei Mureşianu, și funcționează într-una dintre cele mai vechi construcții în stil gotic din Piața Sfatului.\n\n🔗 Bilete: https://booktes.com/cumpara/muzeul-casa-muresenilor-brasov',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Museum',
                price_level: '€',
                address: 'Piața Sfatului, nr. 25, Brașov',
                latitude: 45.6425,
                longitude: 25.5890,
                image_url: '/images/brasov/muzeul_casa_muresenilor_brasov.jpg',
                ticket_url: 'https://booktes.com/cumpara/muzeul-casa-muresenilor-brasov',
                rating: 4.5,
                is_verified: true
            }
        },
        {
            name: 'Muzeul Casa Ștefan Baciu',
            description: '„Casa Ștefan Baciu”, sau Casa Galbenă, este situată în zona istorică a Brașovului, în apropierea Porții Schei. Memorial dedicat poetului și publicistului Ștefan Baciu.\n\n🔗 Bilete: https://booktes.com/cumpara/muzeul-casa-stefan-baciu-brasov',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Museum',
                price_level: '€',
                address: 'Strada Doctor Gheorghe Baiulescu, nr. 9, Brașov',
                latitude: 45.6377,
                longitude: 25.5864,
                image_url: '/images/brasov/muzeul_casa_stefan_baciu_brasov.jpg',
                ticket_url: 'https://booktes.com/cumpara/muzeul-casa-stefan-baciu-brasov',
                rating: 4.4,
                is_verified: true
            }
        },
        {
            name: 'Muzeul de Artă Brașov',
            description: 'O clădire construită în 1902 pe Bulevardul Eroilor nr.21, reprezentantă a stilului neobaroc, găzduiește în prezent Muzeul de Artă Brașov. Galeria Națională reunește lucrări reprezentative pentru arta plastică din spaţiul românesc.\n\n🔗 Bilete: https://booktes.com/cumpara/muzeul-de-arta-brasov',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Art Gallery',
                price_level: '€',
                address: 'Bulevardul Eroilor, nr. 21, Brașov',
                latitude: 45.6423,
                longitude: 25.5889,
                image_url: '/images/brasov/muzeul_de_arta.jpg',
                ticket_url: 'https://booktes.com/cumpara/muzeul-de-arta-brasov',
                rating: 4.7,
                is_verified: true
            }
        },
        {
            name: 'Prima Școală Românească',
            description: 'Biserica Sf. Nicolae din Șchei, reprezintă creuzetul de formare a ideii de românism, casa limbii române și casa imnului național. Locul unde s-au ținut primele cursuri în limba română (1583).\n\n🔗 Bilete: https://booktes.com/cumpara/prima-scoala-romaneasca',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'History',
                price_level: '€',
                address: 'Piața Unirii, nr. 2-3, Brașov',
                latitude: 45.6358,
                longitude: 25.5812,
                image_url: '/images/brasov/muzeul_prima_scoala.jpg',
                ticket_url: 'https://booktes.com/cumpara/prima-scoala-romaneasca',
                rating: 4.9,
                is_verified: true
            }
        },
        {
            name: 'Olimpia - Muzeul Sportului și Turismului Montan',
            description: 'OLIMPIA - Primul muzeu al sportului și turismului montan din România. Proiect de cercetare curatorială și valorificare a patrimoniului sportiv brașovean.\n\n🔗 Bilete: https://booktes.com/cumpara/olimpia-muzeul-sportului-si-turismului-montan',
            category: 'Activities',
            city_id: cityId,
            owner_user_id: ownerId,
            type: 'activity',
            attributes: {
                subcategory: 'Museum',
                price_level: '€',
                address: 'Strada George Coșbuc, nr. 2, Brașov',
                latitude: 45.6400,
                longitude: 25.5900,
                image_url: '/images/brasov/muzeul_sportului.jpg',
                ticket_url: 'https://booktes.com/cumpara/olimpia-muzeul-sportului-si-turismului-montan',
                rating: 4.6,
                is_verified: true
            }
        }
    ]

    // 4. Cleanup old
    const names = businesses.map(b => b.name)
    console.log('Cleaning up existing businesses:', names)
    const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('city_id', cityId)
        .in('name', names)

    if (deleteError) {
        console.error('Error deleting', deleteError)
        // continue?
    } else {
        console.log('Deleted existing.')
    }

    // 5. Insert new
    console.log('Inserting new businesses...')
    for (const b of businesses) {
        const { error: insertError } = await supabase.from('businesses').insert({
            name: b.name,
            description: b.description,
            category: b.category,
            city_id: b.city_id,
            owner_user_id: b.owner_user_id,
            type: b.type,
            attributes: b.attributes
        })

        if (insertError) {
            console.error(`Error inserting ${b.name}:`, insertError)
        } else {
            console.log(`Inserted ${b.name}`)
        }
    }

    console.log('Done.')
}

seed()
