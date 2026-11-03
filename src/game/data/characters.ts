export interface CharacterData {
    id: string;
    name: string;
    title: string;
    quote: string;
    avatarColor: number;
    accentColor: number;
    clothesColor: number;
    headStyle: 'turban' | 'curly' | 'bald-cap' | 'saree-pallu' | 'muffler';
    stats: {
        attack: number;    // 0 - 100
        defense: number;   // 0 - 100
        speed: number;     // 0 - 100
        shakti: number;    // 0 - 100
    };
    specialMove: {
        name: string;
        damage: number;
        cost: number;
        description: string;
    };
    superMove: {
        name: string;
        damage: number;
        description: string;
    };
}

export const CHARACTERS: CharacterData[] = [
    {
        id: 'mitraman',
        name: 'MITRAMAN',
        title: 'The 56-Inch Orator',
        quote: 'Mitron! Victory is non-negotiable!',
        avatarColor: 0xff9933,
        accentColor: 0x138808,
        clothesColor: 0xffffff,
        headStyle: 'turban',
        stats: {
            attack: 85,
            defense: 90,
            speed: 70,
            shakti: 90
        },
        specialMove: {
            name: 'Vikas Wave',
            damage: 22,
            cost: 25,
            description: 'Shockwave blast projecting forward.'
        },
        superMove: {
            name: '56-INCH IMPACT',
            damage: 48,
            description: 'Devastating chest-tackle that sends the foe flying across the arena!'
        }
    },
    {
        id: 'yatra-boy',
        name: 'YATRA BOY',
        title: 'The Relentless Walker',
        quote: 'Walking 4000 km just to drop this combo!',
        avatarColor: 0x336699,
        accentColor: 0xffffff,
        clothesColor: 0xf5f5f5,
        headStyle: 'curly',
        stats: {
            attack: 75,
            defense: 70,
            speed: 95,
            shakti: 80
        },
        specialMove: {
            name: 'Sprint Kick',
            damage: 20,
            cost: 20,
            description: 'High velocity dash strike.'
        },
        superMove: {
            name: 'MOHABBAT THUNDER',
            damage: 45,
            description: 'Lightning-fast multi-hit flurry concluding in a flying skyward kick!'
        }
    },
    {
        id: 'dozer-dada',
        name: 'DOZER DADA',
        title: 'The Saffron Demolisher',
        quote: 'No illegal structures... and no mercy!',
        avatarColor: 0xcc5500,
        accentColor: 0xffcc00,
        clothesColor: 0xff8800,
        headStyle: 'bald-cap',
        stats: {
            attack: 95,
            defense: 85,
            speed: 55,
            shakti: 85
        },
        specialMove: {
            name: 'Brick Slam',
            damage: 26,
            cost: 30,
            description: 'Tremor slam creating ground shockwaves.'
        },
        superMove: {
            name: 'BULLDOZER RAMPAGE',
            damage: 55,
            description: 'An unstoppable armored charge crushing through all enemy defense!'
        }
    },
    {
        id: 'didi-thunder',
        name: 'DIDI THUNDER',
        title: 'The Street Challenger',
        quote: 'Khela Hobe! Game on!',
        avatarColor: 0x00a86b,
        accentColor: 0x0077be,
        clothesColor: 0xffffff,
        headStyle: 'saree-pallu',
        stats: {
            attack: 80,
            defense: 65,
            speed: 90,
            shakti: 95
        },
        specialMove: {
            name: 'Chappal Flurry',
            damage: 24,
            cost: 25,
            description: 'Rapid-fire cyclone kick.'
        },
        superMove: {
            name: 'KHELA HOBE CYCLONE',
            damage: 50,
            description: 'Summons a roaring political storm spinning the opponent into the sky!'
        }
    },
    {
        id: 'muffler-man',
        name: 'MUFFLER MAN',
        title: 'The Common Crusader',
        quote: 'Dharna time is over... now we rumble!',
        avatarColor: 0x800000,
        accentColor: 0x2e8b57,
        clothesColor: 0xc2b280,
        headStyle: 'muffler',
        stats: {
            attack: 70,
            defense: 80,
            speed: 80,
            shakti: 90
        },
        specialMove: {
            name: 'Broom Whirl',
            damage: 20,
            cost: 20,
            description: 'Sweeps away the enemy guard with rapid deflection.'
        },
        superMove: {
            name: 'DHARNA WHIRLWIND',
            damage: 46,
            description: 'Unfurls a defensive storm of smog and strikes from all angles!'
        }
    }
];
