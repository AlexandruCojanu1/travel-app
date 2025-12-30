import { createClient } from '@/lib/supabase/client'

export interface NatureReserve {
  id: string
  name: string
  city_id: string
  category: string
  latitude: number
  longitude: number
  description: string | null
  area_hectares: number | null
  iucn_category: string | null
  reserve_type: string | null
  image_url: string | null
}

/**
 * Get nature reserves for a specific city
 */
export async function getNatureReservesForCity(cityId: string): Promise<NatureReserve[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('nature_reserves')
      .select('*')
      .eq('city_id', cityId)

    if (error) {
      console.error('Error fetching nature reserves:', error)
      return []
    }

    // Filter out reserves without coordinates
    return (data || []).filter(
      (reserve: any) => {
        const attributes = reserve.attributes || {}
        const lat = reserve.latitude ?? reserve.lat ?? attributes.latitude ?? attributes.lat
        const lng = reserve.longitude ?? reserve.lng ?? attributes.longitude ?? attributes.lng
        return lat != null && lng != null
      }
    ).map((reserve: any) => {
      const attributes = reserve.attributes || {}
      const lat = reserve.latitude ?? reserve.lat ?? attributes.latitude ?? attributes.lat
      const lng = reserve.longitude ?? reserve.lng ?? attributes.longitude ?? attributes.lng
      
      return {
        id: reserve.id,
        name: reserve.name,
        city_id: reserve.city_id,
        category: reserve.category || 'Nature',
        latitude: lat,
        longitude: lng,
        description: reserve.description,
        area_hectares: reserve.area_hectares ?? attributes.area_hectares ?? null,
        iucn_category: reserve.iucn_category ?? attributes.iucn_category ?? null,
        reserve_type: reserve.reserve_type ?? attributes.reserve_type ?? null,
        image_url: reserve.image_url ?? attributes.image_url ?? null,
      }
    })
  } catch (error) {
    console.error('Unexpected error fetching nature reserves:', error)
    return []
  }
}

/**
 * Hardcoded nature reserves for Brașov county
 * Based on: https://ro.wikipedia.org/wiki/Lista_rezervațiilor_naturale_din_județul_Brașov
 */
export const BRASOV_NATURE_RESERVES: Array<{
  name: string
  latitude: number
  longitude: number
  description: string
  area_hectares: number
  iucn_category: string
  reserve_type: string
}> = [
  // Bucegi (Abruptul Bucșoiu, Mălăești, Gaura)
  {
    name: 'Bucegi (Abruptul Bucșoiu, Mălăești, Gaura)',
    latitude: 45.4167,
    longitude: 25.4667,
    description: 'Rezervație naturală mixtă în zona Bucegi',
    area_hectares: 113,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Bălțile piscicole Rotbav
  {
    name: 'Bălțile piscicole Rotbav',
    latitude: 45.7500,
    longitude: 25.4833,
    description: 'Rezervație avifaunistică',
    area_hectares: 42,
    iucn_category: 'IV',
    reserve_type: 'avifaunistic',
  },
  // Cheile Zărneștilor
  {
    name: 'Cheile Zărneștilor',
    latitude: 45.3833,
    longitude: 25.3167,
    description: 'Monument al naturii - chei geologice',
    area_hectares: 109.80,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Cheile Dopca
  {
    name: 'Cheile Dopca',
    latitude: 45.9500,
    longitude: 25.5167,
    description: 'Monument al naturii - chei geologice și geomorfologice',
    area_hectares: 4,
    iucn_category: 'III',
    reserve_type: 'geologic și geomorfologic',
  },
  // Coloanele de bazalt de la Piatra Cioplită
  {
    name: 'Coloanele de bazalt de la Piatra Cioplită',
    latitude: 45.9000,
    longitude: 25.2333,
    description: 'Monument al naturii - formări geologice',
    area_hectares: 1,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Coloanele de bazalt de la Racoș
  {
    name: 'Coloanele de bazalt de la Racoș',
    latitude: 46.0167,
    longitude: 25.4000,
    description: 'Monument al naturii - coloane de bazalt',
    area_hectares: 1.10,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Complexul Geologic Racoșul de Jos
  {
    name: 'Complexul Geologic Racoșul de Jos',
    latitude: 46.0167,
    longitude: 25.4000,
    description: 'Rezervație naturală geologică',
    area_hectares: 95,
    iucn_category: 'IV',
    reserve_type: 'geologic',
  },
  // Complexul piscicol Dumbrăvița
  {
    name: 'Complexul piscicol Dumbrăvița',
    latitude: 45.7667,
    longitude: 25.4333,
    description: 'Rezervație avifaunistică',
    area_hectares: 414,
    iucn_category: 'IV',
    reserve_type: 'avifaunistic',
  },
  // Cotul Turzunului
  {
    name: 'Cotul Turzunului',
    latitude: 45.6500,
    longitude: 25.5833,
    description: 'Rezervație naturală',
    area_hectares: 0.50,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Rezervația naturală Tâmpa
  {
    name: 'Rezervația naturală Tâmpa',
    latitude: 45.6417,
    longitude: 25.5883,
    description: 'Rezervație naturală în centrul Brașovului',
    area_hectares: 17.50,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
]

/**
 * Recreation and leisure areas in Brașov
 * Based on: https://www.brasovcity.ro/ro/agrement
 */
export const BRASOV_RECREATION_AREAS: Array<{
  name: string
  latitude: number
  longitude: number
  description: string
  category: string
}> = [
  // Centrul de Agrement și Sport Brașov
  {
    name: 'Centrul de Agrement și Sport Brașov',
    latitude: 45.6500,
    longitude: 25.6000,
    description: 'Bowling, escaladă, minigolf, jocuri electronice, tenis de masă',
    category: 'Recreation',
  },
  // Planetariu Brașov
  {
    name: 'Planetariu Brașov',
    latitude: 45.6417,
    longitude: 25.5883,
    description: 'Planetariu digital cu proiecții 4K și sistem audio 7.1 Surround',
    category: 'Recreation',
  },
  // Grădina Zoologică Brașov
  {
    name: 'Grădina Zoologică Brașov',
    latitude: 45.6417,
    longitude: 25.5883,
    description: 'Grădina zoologică și planetariu',
    category: 'Recreation',
  },
  // Piatra Craiului
  {
    name: 'Piatra Craiului',
    latitude: 45.3667,
    longitude: 25.2500,
    description: 'Rezervație naturală montană',
    area_hectares: 1479,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Postăvarul
  {
    name: 'Postăvarul',
    latitude: 45.5833,
    longitude: 25.5500,
    description: 'Rezervație naturală montană',
    area_hectares: 500,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // PARCUL NAȚIONAL PIATRA CRAIULUI - Peștera Liliecilor
  {
    name: 'Peștera Liliecilor',
    latitude: 45.3667,
    longitude: 25.2500,
    description: 'Peșteră din Parcul Național Piatra Craiului',
    area_hectares: null,
    iucn_category: 'II',
    reserve_type: 'geologic',
  },
  // PARCUL NATURAL BUCEGI - Locul fosilifer de la Vama Strunga
  {
    name: 'Locul fosilifer de la Vama Strunga',
    latitude: 45.4167,
    longitude: 25.4667,
    description: 'Loc fosilifer din Parcul Natural Bucegi',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'paleontologic',
  },
  // ARII PROTEJATE DIN ZONA BRAȘOVULUI - Stejerișul Mare
  {
    name: 'Stejerișul Mare',
    latitude: 45.6500,
    longitude: 25.6000,
    description: 'Arie protejată - stejeriș',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // Peștera Valea Cetății
  {
    name: 'Peștera Valea Cetății',
    latitude: 45.6417,
    longitude: 25.5883,
    description: 'Peșteră din zona Brașovului',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Dealul Cetății Lempeș
  {
    name: 'Dealul Cetății Lempeș',
    latitude: 45.6500,
    longitude: 25.6000,
    description: 'Arie protejată - deal cu cetate',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Mlaștina Hărman
  {
    name: 'Mlaștina Hărman',
    latitude: 45.7167,
    longitude: 25.6833,
    description: 'Mlaștină protejată',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'avifaunistic',
  },
  // Pădurile și mlaștinile eutrofe de la Prejmer
  {
    name: 'Pădurile și mlaștinile eutrofe de la Prejmer',
    latitude: 45.7167,
    longitude: 25.7667,
    description: 'Păduri și mlaștini eutrofe',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // Holbav
  {
    name: 'Holbav',
    latitude: 45.7000,
    longitude: 25.7000,
    description: 'Arie protejată Holbav',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // PIATRA MARE
  {
    name: 'Piatra Mare',
    latitude: 45.5500,
    longitude: 25.5000,
    description: 'Masiv montan protejat',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // CIUCAȘ - Locul fosilifer Purcăreni
  {
    name: 'Locul fosilifer Purcăreni',
    latitude: 45.5167,
    longitude: 25.9500,
    description: 'Loc fosilifer din zona Ciucaș',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'paleontologic',
  },
  // Aninișurile de pe Târlung
  {
    name: 'Aninișurile de pe Târlung',
    latitude: 45.5167,
    longitude: 25.9500,
    description: 'Aninișuri protejate',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // ZONA MUNȚILOR PERȘANI - Dealurile Homoroadelor
  {
    name: 'Dealurile Homoroadelor',
    latitude: 46.0000,
    longitude: 25.4000,
    description: 'Dealuri protejate',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Locul fosilifer Carhaga
  {
    name: 'Locul fosilifer Carhaga',
    latitude: 46.0167,
    longitude: 25.4000,
    description: 'Loc fosilifer',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'paleontologic',
  },
  // Locul fosilifer Ormeniș
  {
    name: 'Locul fosilifer Ormeniș',
    latitude: 46.0167,
    longitude: 25.4000,
    description: 'Loc fosilifer',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'paleontologic',
  },
  // Peștera Bârlogul Ursului
  {
    name: 'Peștera Bârlogul Ursului',
    latitude: 45.9000,
    longitude: 25.2333,
    description: 'Peșteră protejată',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Peștera Comăna
  {
    name: 'Peștera Comăna',
    latitude: 45.9000,
    longitude: 25.2333,
    description: 'Peșteră protejată',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Vulcanii noroioși de la Homorod
  {
    name: 'Vulcanii noroioși de la Homorod',
    latitude: 46.0000,
    longitude: 25.4000,
    description: 'Vulcani noroioși',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Stânca bazaltică de la Rupea
  {
    name: 'Stânca bazaltică de la Rupea',
    latitude: 46.0333,
    longitude: 25.2167,
    description: 'Stâncă bazaltică protejată',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Microcanionul de bazalt de la Hoghiz
  {
    name: 'Microcanionul de bazalt de la Hoghiz',
    latitude: 45.9833,
    longitude: 25.3000,
    description: 'Microcanion bazaltic',
    area_hectares: null,
    iucn_category: 'III',
    reserve_type: 'geologic',
  },
  // Perșani
  {
    name: 'Perșani',
    latitude: 45.9500,
    longitude: 25.5167,
    description: 'Arie protejată Perșani',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Pădurea Bogății
  {
    name: 'Pădurea Bogății',
    latitude: 45.9500,
    longitude: 25.5167,
    description: 'Pădure protejată',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // ZONA MUNȚILOR FĂGĂRAȘ - Poienile cu narcise de la Dumbrava Vadului
  {
    name: 'Poienile cu narcise de la Dumbrava Vadului',
    latitude: 45.5000,
    longitude: 24.8000,
    description: 'Poieni cu narcise',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // Munții Făgăraș
  {
    name: 'Munții Făgăraș',
    latitude: 45.5000,
    longitude: 24.8000,
    description: 'Masiv montan protejat',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Piemontul Făgăraș
  {
    name: 'Piemontul Făgăraș',
    latitude: 45.5000,
    longitude: 24.8000,
    description: 'Piemont protejat',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // BAZINUL OLTULUI - Oltul Mijlociu – Cibin – Hârtibaciu
  {
    name: 'Oltul Mijlociu – Cibin – Hârtibaciu',
    latitude: 45.8000,
    longitude: 24.1500,
    description: 'Arie protejată fluvială',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'avifaunistic',
  },
  // Avrig – Scorei – Făgăraș
  {
    name: 'Avrig – Scorei – Făgăraș',
    latitude: 45.7167,
    longitude: 24.3833,
    description: 'Arie protejată',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Oltul Superior
  {
    name: 'Oltul Superior',
    latitude: 45.5000,
    longitude: 24.8000,
    description: 'Arie protejată fluvială',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'avifaunistic',
  },
  // PODIȘUL HÂRTIBACIULUI - Podișul Hârtibaciului
  {
    name: 'Podișul Hârtibaciului',
    latitude: 46.2000,
    longitude: 24.8000,
    description: 'Podiș protejat',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Pădurea de gorun și stejar de pe Dealul Purcăretului
  {
    name: 'Pădurea de gorun și stejar de pe Dealul Purcăretului',
    latitude: 46.2000,
    longitude: 24.8000,
    description: 'Pădure de gorun și stejar',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // Pădurea de gorun și stejar de la Dosul Fănațului
  {
    name: 'Pădurea de gorun și stejar de la Dosul Fănațului',
    latitude: 46.2000,
    longitude: 24.8000,
    description: 'Pădure de gorun și stejar',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'botanic',
  },
  // Hârtibaciu Sud-Est
  {
    name: 'Hârtibaciu Sud-Est',
    latitude: 46.2000,
    longitude: 24.8000,
    description: 'Arie protejată Hârtibaciu',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // Sighișoara – Târnava Mare
  {
    name: 'Sighișoara – Târnava Mare',
    latitude: 46.2167,
    longitude: 24.7917,
    description: 'Arie protejată',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // MUNȚII BODOC - BARAOLT - Dealul Ciocaș – Dealul Vițelului
  {
    name: 'Dealul Ciocaș – Dealul Vițelului',
    latitude: 46.0667,
    longitude: 25.5833,
    description: 'Dealuri protejate',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
  // LEAOTA
  {
    name: 'Leaota',
    latitude: 45.3667,
    longitude: 25.2500,
    description: 'Masiv montan protejat',
    area_hectares: null,
    iucn_category: 'IV',
    reserve_type: 'mixt',
  },
]

/**
 * Get hardcoded nature reserves for Brașov
 */
export function getBrasovNatureReserves(): Array<{
  name: string
  latitude: number
  longitude: number
  description: string
  area_hectares: number
  iucn_category: string
  reserve_type: string
}> {
  return BRASOV_NATURE_RESERVES
}

/**
 * Get recreation and leisure areas for Brașov
 */
export function getBrasovRecreationAreas(): Array<{
  name: string
  latitude: number
  longitude: number
  description: string
  category: string
}> {
  return BRASOV_RECREATION_AREAS
}

