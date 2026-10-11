export type PracticePassage = {
    id: string;
    title: string;
    byline: string;
    category: string;
    description: string;
    text: string;
};

export const PRACTICE_PASSAGES: PracticePassage[] = [
    {
        id: 'morning-light',
        title: 'A slower morning',
        byline: 'TypeMaster Studio',
        category: 'Mindful reading',
        description: 'A small pause before the day begins.',
        text: 'The room was quiet before the city woke. A pale line of sunlight moved slowly across the desk, touching the open notebook and the cup beside it. Nothing needed to happen at once. For a few minutes, the morning belonged to the soft rhythm of thought, a steady breath, and words finding their place on the page.'
    },
    {
        id: 'small-details',
        title: 'The value of small details',
        byline: 'TypeMaster Studio',
        category: 'Everyday essays',
        description: 'Notice more by moving a little slower.',
        text: 'A familiar walk can feel new when you pay attention. Notice the uneven edge of a stone, the warmth of a window in late afternoon, or the brief pause between two passing cars. Small details do not ask for much time. They simply reward the attention we already have, and make an ordinary hour feel more complete.'
    },
    {
        id: 'clear-thinking',
        title: 'Room for clear thinking',
        byline: 'TypeMaster Studio',
        category: 'Creative practice',
        description: 'Let one thought arrive before the next.',
        text: 'Good ideas rarely arrive by force. They appear when the mind has enough room to connect what it already knows. A page, a quiet desk, and an unhurried stretch of time can make that room. Begin with one clear sentence. Follow it with another. The work becomes easier when attention is allowed to settle.'
    },
    {
        id: 'open-water',
        title: 'A walk beside the water',
        byline: 'TypeMaster Studio',
        category: 'Field notes',
        description: 'A short passage shaped by the shoreline.',
        text: 'By the water, the horizon gave every thought a little more space. A small boat crossed the bay without hurry, leaving a fine line that disappeared almost as soon as it formed. The air smelled of rain and salt. For a moment, there was only the light on the surface and the sound of steps along the shore.'
    }
];

export function getPassage(id: string) {
    return PRACTICE_PASSAGES.find((passage) => passage.id === id) ?? PRACTICE_PASSAGES[0]!;
}
