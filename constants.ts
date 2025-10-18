import { Story, BibleReference } from './types';

export const STORIES: Story[] = [
  {
    id: 'noahs-ark',
    title: "Noah's Ark and the Great Flood",
    description: "Help Noah build the ark and survive the great flood that reshaped the world.",
    initialPrompt: `Start the biblical story of Noah's Ark. The user, named {userName}, is a helper assisting Noah's family. The user's appearance is '{userAvatarDescription}'. Introduce Noah, who is overseeing the final preparations. Noah should speak to the user, expressing the urgency of the situation as dark clouds gather and the first drops of rain fall. The choices you provide should be direct responses or questions for Noah. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&h=300&fit=crop',
    bibleReference: {
      book: 'Genesis',
      chapters: '6-9',
      verses: '6:9-9:17',
    },
  },
  {
    id: 'moses-red-sea',
    title: 'Moses and the Red Sea',
    description: "Join the Israelites as they escape Egypt and witness the miraculous parting of the Red Sea.",
    initialPrompt: `Start the biblical story of Moses parting the Red Sea. The user, named {userName}, is an Israelite who has just escaped Egypt. The user's appearance is '{userAvatarDescription}'. Describe the scene with the Red Sea ahead and Pharaoh's army approaching. Introduce Moses, who is trying to calm the terrified crowd. Moses should speak to the user. The choices you provide should be direct responses or questions for Moses. Capture the feeling of fear and desperation. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop',
    bibleReference: {
      book: 'Exodus',
      chapters: '14',
      verses: '14:1-31',
    },
  },
  {
    id: 'david-goliath',
    title: 'David and Goliath',
    description: 'Witness the tale of courage and faith as a young shepherd faces a giant warrior.',
    initialPrompt: `Start the biblical story of David and Goliath. The user, named {userName}, is a friend of David. The user's appearance is '{userAvatarDescription}'. Describe the scene in the Valley of Elah with the armies facing each other. David should express his frustration with Goliath's mockery and his faith in God to the user. The choices you provide should be direct responses or questions for David. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=500&h=300&fit=crop',
    bibleReference: {
      book: '1 Samuel',
      chapters: '17',
      verses: '17:1-58',
    },
  },
  {
    id: 'daniel-lions',
    title: "Daniel in the Lions' Den",
    description: 'Experience the story of unwavering faith as Daniel faces a den of hungry lions.',
    initialPrompt: `Start the biblical story of Daniel in the lions' den. The user, named {userName}, is a fellow advisor in King Darius's court and a friend to Daniel. The user's appearance is '{userAvatarDescription}'. Describe the scene just after the decree has been made, trapping Daniel. The user meets with Daniel in private. Daniel should express his unwavering faith to the user despite the danger. The choices you provide should be direct responses or questions for Daniel. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=500&h=300&fit=crop',
    bibleReference: {
      book: 'Daniel',
      chapters: '6',
      verses: '6:1-28',
    },
  },
  {
    id: 'nativity',
    title: 'The Birth of a King',
    description: 'Travel to Bethlehem and witness the humble birth of Jesus Christ.',
    initialPrompt: `Start the biblical story of the nativity. The user, named {userName}, is a young shepherd tending flocks outside Bethlehem. The user's appearance is '{userAvatarDescription}'. Describe the night sky as an angel appears, announcing the birth of the Savior. The angel gives its message. The choices you provide should be direct questions to the angel or responses to the incredible news. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=500&h=300&fit=crop',
    bibleReference: {
      book: 'Luke',
      chapters: '2',
      verses: '2:1-20',
    },
  },
  {
    id: 'resurrection',
    title: 'The Crucifixion & Resurrection',
    description: 'Experience the sorrow of the crucifixion and the ultimate triumph of the resurrection.',
    initialPrompt: `Start the biblical story of the crucifixion of Jesus. The user, named {userName}, is a follower of Jesus at Golgotha. The user's appearance is '{userAvatarDescription}'. Introduce the disciple John, who is also present. John should speak to the user, expressing his sorrow and confusion. The choices you provide should be direct responses or questions for John, sharing in the somber moment. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=500&h=300&fit=crop',
    bibleReference: {
      book: 'John',
      chapters: '19-20',
      verses: '19:17-20:31',
    },
  },
];