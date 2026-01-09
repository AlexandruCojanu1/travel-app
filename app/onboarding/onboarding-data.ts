
export type ProtagonistType = 'solo' | 'couple' | 'family' | 'group'
export type MobilityType = 'car' | 'transit' | 'walk' | 'transit_walk'
export type BudgetPersona = 'nomad' | 'comfort' | 'balanced' | 'budget'

export interface OnboardingState {
    // Stage 0: Context
    homeCityId: string

    // Stage 1: Protagonists
    protagonist: ProtagonistType | null
    soloMood?: 'social' | 'quiet'
    soloDining?: 'low' | 'high'
    familyKids?: string[] // '0-4', '5-12', '13-18'
    familyStroller?: boolean
    familyWifi?: boolean // for teens
    groupBill?: 'split' | 'individual'
    groupVibe?: 'party' | 'talk'

    // Stage 2: Mobility
    mobility: MobilityType | null
    carParking?: 'critical' | 'flexible'
    carDriver?: boolean
    walkDist?: '500m' | '1.5km' | '3km'
    walkTradeoff?: boolean

    // Stage 3: Budget
    budgetPersona: BudgetPersona | null
    budgetPeriphery?: boolean

    // Stage 4: Diet
    diet: string[] // 'omnivore', 'vegan', 'vegetarian', 'gf'
    dietStrictness?: 'strict' | 'flexible' // for mixed groups

    // Stage 5: Psychographics
    adventurous: number // 0-100 (0=Familiar, 100=Adventurous)
    spontaneity: number // 0-100 (0=Planned, 100=Spontaneous)
    popularity: number // 0-100 (0=Popular, 100=Hidden)
}

export const INITIAL_STATE: OnboardingState = {
    homeCityId: '',
    protagonist: null,
    mobility: null,
    budgetPersona: null,
    diet: [],
    adventurous: 50,
    spontaneity: 50,
    popularity: 50,
}
