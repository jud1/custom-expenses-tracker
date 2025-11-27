export const ADJECTIVES = [
    "Happy", "Lucky", "Sunny", "Brave", "Calm", "Eager", "Fancy", "Gentle",
    "Jolly", "Kind", "Lively", "Nice", "Proud", "Silly", "Witty", "Zealous",
    "Cosmic", "Magic", "Super", "Mega", "Hyper", "Ultra", "Rapid", "Swift"
];

export const NOUNS = [
    "Tiger", "Lion", "Bear", "Eagle", "Wolf", "Fox", "Cat", "Dog",
    "Panda", "Koala", "Hawk", "Owl", "Shark", "Whale", "Dolphin", "Star",
    "Comet", "Planet", "Moon", "Sun", "Galaxy", "Nebula", "Rocket", "Pilot"
];

export function generateRandomName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj} ${noun}`;
}
