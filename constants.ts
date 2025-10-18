import { Story } from './types';

export const STORIES: Story[] = [
  {
    id: 'david-goliath',
    title: 'David and Goliath',
    description: 'Witness the tale of courage and faith as a young shepherd faces a giant warrior.',
    initialPrompt: `Start the biblical story of David and Goliath. The user, named {userName}, is a friend of David. The user's appearance is '{userAvatarDescription}'. Describe the scene in the Valley of Elah with the two armies facing each other. Introduce the threat of Goliath. Give the user three choices on how to react to the situation. Make the narrative engaging and descriptive, and be sure to include the user's character in the events.`,
    coverImage: 'https://picsum.photos/seed/david/600/400',
  },
    {
    id: 'daniel-lions',
    title: "Daniel in the Lions' Den",
    description: 'Experience the story of unwavering faith as Daniel faces a den of hungry lions.',
    initialPrompt: `Start the biblical story of Daniel in the lions' den. The user, named {userName}, is a fellow advisor in King Darius's court. The user's appearance is '{userAvatarDescription}'. Describe the political tension and the decree that traps Daniel. Give the user three choices on how to react to Daniel's predicament. Make the narrative engaging and descriptive, and be sure to include the user's character in the events.`,
    coverImage: 'https://picsum.photos/seed/daniel/600/400',
  },
  {
    id: 'moses-red-sea',
    title: 'Moses and the Red Sea',
    description: "Join the Israelites as they escape Egypt and witness the miraculous parting of the Red Sea.",
    initialPrompt: `Start the biblical story of Moses parting the Red Sea. The user, named {userName}, is an Israelite who has just escaped Egypt. The user's appearance is '{userAvatarDescription}'. Describe the scene with the Red Sea ahead and Pharaoh's army approaching from behind. Capture the feeling of fear and desperation. Give the user three choices. Make the narrative engaging and descriptive, and be sure to include the user's character in the events.`,
    coverImage: 'https://picsum.photos/seed/moses/600/400',
  },
];