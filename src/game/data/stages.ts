export interface StageData {
    id: string;
    name: string;
    subtitle: string;
    skyTopColor: number;
    skyBottomColor: number;
    groundColor: number;
    accentColor: number;
    features: string[];
}

export const STAGES: StageData[] = [
    {
        id: 'jantar-mantar',
        name: 'JANTAR MANTAR',
        subtitle: 'Plaza of Resilient Voices',
        skyTopColor: 0x1a0933,
        skyBottomColor: 0xff6633,
        groundColor: 0x3a3a44,
        accentColor: 0xffcc00,
        features: ['barricades', 'fluttering-banners', 'streetlights', 'crowd-silhouette']
    },
    {
        id: 'desi-sadak',
        name: 'DESI SADAK',
        subtitle: 'Chai Stalls & Street Hustle',
        skyTopColor: 0x051b2c,
        skyBottomColor: 0x334466,
        groundColor: 0x222228,
        accentColor: 0x00e5ff,
        features: ['chai-stall', 'auto-rickshaw', 'neon-boards', 'potholes']
    },
    {
        id: 'parliament-arena',
        name: 'SANSAD BHAVAN',
        subtitle: 'The Grand Hall of Verdicts',
        skyTopColor: 0x221100,
        skyBottomColor: 0x663311,
        groundColor: 0x4a2c1b,
        accentColor: 0xffd700,
        features: ['pillars', 'red-carpet', 'speaker-gavel', 'gold-trim']
    }
];
