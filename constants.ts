import { Story, BibleReference, SpeechifyVoice } from './types';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: 'fjnwTZkKtQOJaYzGLa6n', // David
    name: 'David',
    description: 'Male English narrator'
  },
  {
    id: 'G4Wh6MqJNTzYtuAeMqv5', // Eve
    name: 'Eve',
    description: 'Female English narrator'
  },
  {
    id: 'sla02gCKN0hNfNn9ORJN', // Alwin
    name: 'Alwin',
    description: 'Male narrator with accent'
  },
  {
    id: 'SDNKIYEpTz0h56jQX8rA', // Sherry
    name: 'Sherry',
    description: 'Female narrator with accent'
  }
];

export const SPEECHIFY_VOICES: SpeechifyVoice[] = [
  {
    id: 'jesse',
    name: 'Jesse',
    description: 'Male English narrator',
    language: 'en-US'
  },
  {
    id: 'sarah',
    name: 'Sarah',
    description: 'Female English narrator',
    language: 'en-US'
  },
  {
    id: 'alex',
    name: 'Alex',
    description: 'Neutral English narrator',
    language: 'en-US'
  }
];

export const STORIES: Story[] = [
  {
    id: 'noahs-ark',
    title: "Noah's Ark and the Great Flood",
    description: "Help Noah build the ark and survive the great flood that reshaped the world.",
    initialPrompt: `Start the biblical story of Noah's Ark. The user, named {userName}, is a helper assisting Noah's family. The user's appearance is '{userAvatarDescription}'. Introduce Noah, who is overseeing the final preparations. Noah should speak to the user, expressing the urgency of the situation as dark clouds gather and the first drops of rain fall. The choices you provide should be direct responses or questions for Noah. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: '/assets/story-covers/noahs-ark.jpg',
    bibleReference: {
      book: 'Genesis',
      chapters: '6-9',
      verses: '6:9-9:17',
    },
    environmentZones: [
      {
        id: 'construction-site',
        name: "Ark Construction Site",
        description: 'massive wooden ark under construction, surrounded by tools and materials, clear skies with gathering storm clouds, rolling hills in background'
      },
      {
        id: 'inside-ark',
        name: "Inside the Ark",
        description: 'wooden interior with animal pens and storage areas, dim lamplight, wooden beams and planks, organized chaos of supplies'
      },
      {
        id: 'flooded-world',
        name: "Flooded World",
        description: 'endless water stretching to horizon, dark stormy skies, waves, the ark floating alone in the vast ocean'
      }
    ],
  },
  {
    id: 'moses-red-sea',
    title: 'Moses and the Red Sea',
    description: "Join the Israelites as they escape Egypt and witness the miraculous parting of the Red Sea.",
    initialPrompt: `Start the biblical story of Moses parting the Red Sea. The user, named {userName}, is an Israelite who has just escaped Egypt. The user's appearance is '{userAvatarDescription}'. Describe the scene with the Red Sea ahead and Pharaoh's army approaching. Introduce Moses, who is trying to calm the terrified crowd. Moses should speak to the user. The choices you provide should be direct responses or questions for Moses. Capture the feeling of fear and desperation. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: '/assets/story-covers/moses-red-sea.jpg',
    bibleReference: {
      book: 'Exodus',
      chapters: '14',
      verses: '14:1-31',
    },
    environmentZones: [
      {
        id: 'red-sea-shore',
        name: "Red Sea Shore",
        description: 'vast Red Sea waters with waves, desert landscape with rocky outcrops, clear blue sky, sandy beach area where Israelites gather'
      },
      {
        id: 'parted-sea',
        name: "Parted Red Sea",
        description: 'miraculous walls of water on both sides, dry seabed path between towering water walls, fish visible in the water walls, dramatic lighting'
      },
      {
        id: 'egyptian-desert',
        name: "Egyptian Desert",
        description: 'harsh desert landscape with dunes, scattered palm trees, distant mountains, hot sun, rocky terrain'
      }
    ],
  },
  {
    id: 'david-goliath',
    title: 'David and Goliath',
    description: 'Witness the tale of courage and faith as a young shepherd faces a giant warrior.',
    initialPrompt: `Start the biblical story of David and Goliath. The user, named {userName}, is a friend of David. The user's appearance is '{userAvatarDescription}'. Describe the scene in the Valley of Elah with the armies facing each other. David should express his frustration with Goliath's mockery and his faith in God to the user. The choices you provide should be direct responses or questions for David. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: '/assets/story-covers/david-goliath.jpg',
    bibleReference: {
      book: '1 Samuel',
      chapters: '17',
      verses: '17:1-58',
    },
    environmentZones: [
      {
        id: 'valley-of-elah',
        name: "Valley of Elah",
        description: 'wide valley with rolling hills on both sides, dry creek bed in center, scattered rocks and boulders, clear blue sky, armies positioned on opposite hills'
      },
      {
        id: 'israelite-camp',
        name: "Israelite Camp",
        description: 'tents and campfires on hillside, soldiers in armor, weapons and shields, view overlooking the valley, morning light'
      },
      {
        id: 'battlefield',
        name: "Battlefield",
        description: 'open ground in valley center, scattered rocks and stones, two armies watching from hillsides, dramatic lighting'
      }
    ],
  },
  {
    id: 'daniel-lions',
    title: "Daniel in the Lions' Den",
    description: 'Experience the story of unwavering faith as Daniel faces a den of hungry lions.',
    initialPrompt: `Start the biblical story of Daniel in the lions' den. The user, named {userName}, is a fellow advisor in King Darius's court and a friend to Daniel. The user's appearance is '{userAvatarDescription}'. Describe the scene just after the decree has been made, trapping Daniel. The user meets with Daniel in private. Daniel should express his unwavering faith to the user despite the danger. The choices you provide should be direct responses or questions for Daniel. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: '/assets/story-covers/daniel-lions.jpg',
    bibleReference: {
      book: 'Daniel',
      chapters: '6',
      verses: '6:1-28',
    },
    environmentZones: [
      {
        id: 'palace',
        name: "King's Palace",
        description: 'ornate Babylonian palace with tall marble pillars, golden decorations, torchlit corridors, rich tapestries, royal throne room with elaborate furnishings'
      },
      {
        id: 'lions-den',
        name: "Lions' Den",
        description: 'deep limestone cave pit with rough stone walls, dim torchlight filtering from above, scattered bones, damp stone floor, iron bars at entrance'
      },
      {
        id: 'palace-garden',
        name: "Palace Garden",
        description: 'beautiful palace gardens with hanging gardens, fountains, palm trees, stone pathways, peaceful setting for prayer'
      }
    ],
  },
  {
    id: 'nativity',
    title: 'The Birth of a King',
    description: 'Travel to Bethlehem and witness the humble birth of Jesus Christ.',
    initialPrompt: `Start the biblical story of the nativity. The user, named {userName}, is a young shepherd tending flocks outside Bethlehem. The user's appearance is '{userAvatarDescription}'. Describe the night sky as an angel appears, announcing the birth of the Savior. The angel gives its message. The choices you provide should be direct questions to the angel or responses to the incredible news. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: '/assets/story-covers/nativity.jpg',
    bibleReference: {
      book: 'Luke',
      chapters: '2',
      verses: '2:1-20',
    },
    environmentZones: [
      {
        id: 'shepherd-fields',
        name: "Shepherd Fields",
        description: 'rolling hills outside Bethlehem, scattered sheep, olive trees, clear starry night sky, peaceful countryside'
      },
      {
        id: 'stable',
        name: "Bethlehem Stable",
        description: 'humble stone stable with wooden beams, hay and straw, wooden feeding trough, warm lamplight, simple rustic setting'
      },
      {
        id: 'bethlehem-town',
        name: "Bethlehem Town",
        description: 'ancient stone buildings, narrow streets, Roman architecture, bustling marketplace, Middle Eastern town setting'
      }
    ],
  },
  {
    id: 'resurrection',
    title: 'The Crucifixion & Resurrection',
    description: 'Experience the sorrow of the crucifixion and the ultimate triumph of the resurrection.',
    initialPrompt: `Start the biblical story of the crucifixion of Jesus. The user, named {userName}, is a follower of Jesus at Golgotha. The user's appearance is '{userAvatarDescription}'. Introduce the disciple John, who is also present. John should speak to the user, expressing his sorrow and confusion. The choices you provide should be direct responses or questions for John, sharing in the somber moment. Make the narrative engaging and descriptive, and be sure to include the user's character in the events. Generate the narrative, a vivid image prompt, 2-3 choices, and a potential bible lesson.`,
    coverImage: '/assets/story-covers/resurrection.jpg',
    bibleReference: {
      book: 'John',
      chapters: '19-20',
      verses: '19:17-20:31',
    },
    environmentZones: [
      {
        id: 'golgotha',
        name: "Golgotha (Calvary)",
        description: 'rocky hill outside Jerusalem, three crosses on hilltop, dark stormy sky, crowd of onlookers, somber atmosphere'
      },
      {
        id: 'tomb',
        name: "Garden Tomb",
        description: 'stone tomb carved into rock, large circular stone door, garden setting with olive trees, peaceful morning light'
      },
      {
        id: 'jerusalem-streets',
        name: "Jerusalem Streets",
        description: 'ancient stone streets of Jerusalem, Roman architecture, bustling marketplace, Middle Eastern city setting'
      }
    ],
  },
];