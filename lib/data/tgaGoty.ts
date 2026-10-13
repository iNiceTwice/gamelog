export interface TgaNominee {
  title: string;
  isWinner: boolean;
  year: number;
}

export const TGA_GOTY_DATA: Record<number, TgaNominee[]> = {
  2025: [
    { title: 'Clair Obscur: Expedition 33', isWinner: true, year: 2025 },
    { title: 'Death Stranding 2: On the Beach', isWinner: false, year: 2025 },
    { title: 'Donkey Kong Bananza', isWinner: false, year: 2025 },
    { title: 'Hades II', isWinner: false, year: 2025 },
    { title: 'Hollow Knight: Silksong', isWinner: false, year: 2025 },
    { title: 'Kingdom Come: Deliverance II', isWinner: false, year: 2025 },
  ],
  2024: [
    { title: 'Astro Bot', isWinner: true, year: 2024 },
    { title: 'Balatro', isWinner: false, year: 2024 },
    { title: 'Black Myth: Wukong', isWinner: false, year: 2024 },
    { title: 'Elden Ring: Shadow of the Erdtree', isWinner: false, year: 2024 },
    { title: 'Final Fantasy VII Rebirth', isWinner: false, year: 2024 },
    { title: 'Metaphor: ReFantazio', isWinner: false, year: 2024 },
  ],
  2023: [
    { title: "Baldur's Gate 3", isWinner: true, year: 2023 },
    { title: 'Alan Wake 2', isWinner: false, year: 2023 },
    { title: 'The Legend of Zelda: Tears of the Kingdom', isWinner: false, year: 2023 },
    { title: "Marvel's Spider-Man 2", isWinner: false, year: 2023 },
    { title: 'Resident Evil 4', isWinner: false, year: 2023 },
    { title: 'Super Mario Bros. Wonder', isWinner: false, year: 2023 },
  ],
  2022: [
    { title: 'Elden Ring', isWinner: true, year: 2022 },
    { title: 'A Plague Tale: Requiem', isWinner: false, year: 2022 },
    { title: 'God of War Ragnarök', isWinner: false, year: 2022 },
    { title: 'Horizon Forbidden West', isWinner: false, year: 2022 },
    { title: 'Stray', isWinner: false, year: 2022 },
    { title: 'Xenoblade Chronicles 3', isWinner: false, year: 2022 },
  ],
  2021: [
    { title: 'It Takes Two', isWinner: true, year: 2021 },
    { title: 'Deathloop', isWinner: false, year: 2021 },
    { title: 'Metroid Dread', isWinner: false, year: 2021 },
    { title: 'Psychonauts 2', isWinner: false, year: 2021 },
    { title: 'Ratchet & Clank: Rift Apart', isWinner: false, year: 2021 },
    { title: 'Resident Evil Village', isWinner: false, year: 2021 },
  ],
  2020: [
    { title: 'The Last of Us Part II', isWinner: true, year: 2020 },
    { title: 'Animal Crossing: New Horizons', isWinner: false, year: 2020 },
    { title: 'Doom Eternal', isWinner: false, year: 2020 },
    { title: 'Final Fantasy VII Remake', isWinner: false, year: 2020 },
    { title: 'Ghost of Tsushima', isWinner: false, year: 2020 },
    { title: 'Hades', isWinner: false, year: 2020 },
  ],
  2019: [
    { title: 'Sekiro: Shadows Die Twice', isWinner: true, year: 2019 },
    { title: 'Control', isWinner: false, year: 2019 },
    { title: 'Death Stranding', isWinner: false, year: 2019 },
    { title: 'Resident Evil 2', isWinner: false, year: 2019 },
    { title: 'Super Smash Bros. Ultimate', isWinner: false, year: 2019 },
    { title: 'The Outer Worlds', isWinner: false, year: 2019 },
  ],
  2018: [
    { title: 'God of War', isWinner: true, year: 2018 },
    { title: "Assassin's Creed Odyssey", isWinner: false, year: 2018 },
    { title: 'Celeste', isWinner: false, year: 2018 },
    { title: "Marvel's Spider-Man", isWinner: false, year: 2018 },
    { title: 'Monster Hunter: World', isWinner: false, year: 2018 },
    { title: 'Red Dead Redemption 2', isWinner: false, year: 2018 },
  ],
  2017: [
    { title: 'The Legend of Zelda: Breath of the Wild', isWinner: true, year: 2017 },
    { title: 'Horizon Zero Dawn', isWinner: false, year: 2017 },
    { title: 'Persona 5', isWinner: false, year: 2017 },
    { title: "PlayerUnknown's Battlegrounds", isWinner: false, year: 2017 },
    { title: 'Super Mario Odyssey', isWinner: false, year: 2017 },
  ],
  2016: [
    { title: 'Overwatch', isWinner: true, year: 2016 },
    { title: 'Doom', isWinner: false, year: 2016 },
    { title: 'Inside', isWinner: false, year: 2016 },
    { title: 'Titanfall 2', isWinner: false, year: 2016 },
    { title: "Uncharted 4: A Thief's End", isWinner: false, year: 2016 },
  ],
  2015: [
    { title: 'The Witcher 3: Wild Hunt', isWinner: true, year: 2015 },
    { title: 'Bloodborne', isWinner: false, year: 2015 },
    { title: 'Fallout 4', isWinner: false, year: 2015 },
    { title: 'Metal Gear Solid V: The Phantom Pain', isWinner: false, year: 2015 },
    { title: 'Super Mario Maker', isWinner: false, year: 2015 },
  ],
  2014: [
    { title: 'Dragon Age: Inquisition', isWinner: true, year: 2014 },
    { title: 'Bayonetta 2', isWinner: false, year: 2014 },
    { title: 'Dark Souls II', isWinner: false, year: 2014 },
    { title: 'Hearthstone', isWinner: false, year: 2014 },
    { title: 'Middle-earth: Shadow of Mordor', isWinner: false, year: 2014 },
  ],
};

export const TGA_AVAILABLE_YEARS = Object.keys(TGA_GOTY_DATA)
  .map(Number)
  .sort((a, b) => b - a);
