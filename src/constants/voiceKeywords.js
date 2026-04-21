/**
 * Multilingual voice command keyword map.
 * Covers English, Hinglish, and Marathlish (Maharashtra context).
 * All entries are lowercase — compare against lowercased STT transcript.
 */
const VOICE_KEYWORDS = {
  took: [
    // English
    'took', 'taken', 'done', 'yes', 'confirmed', 'finished', 'consumed', 'had it', 'eaten',
    // Hinglish
    'le li', 'le liya', 'kha li', 'kha liya', 'ho gaya', 'haan', 'khaya', 'pi li', 'pi liya',
    'le chuka', 'kha chuka', 'tha', 'le chu', 'kha chu',
    // Marathlish
    'ghetle', 'ghetli', 'zhale', 'ho', 'khatle', 'ghetali', 'dhatle', 'hoi', 'aahe',
    'gheun gheto', 'khallele', 'dimak nahi',
  ],
  missed: [
    // English
    'missed', 'skip', 'no', 'forgot', 'skipped', 'cannot', 'nope', 'not taken', 'did not',
    'didnt', "didn't", 'forget',
    // Hinglish
    'nahi', 'bhool gaya', 'bhool gayi', 'choot gaya', 'nahi kiya', 'nahi le', 'nahi kha',
    'mat', 'nahi tha', 'chuka nahi', 'rahe gaya',
    // Marathlish
    'nahi', 'visarla', 'visarli', 'nahi ghetle', 'chukli', 'raahile', 'nahi khatle',
    'path nahi', 'gheto nahi',
  ],
  snoozed: [
    // English
    'snooze', 'later', 'remind', 'wait', 'five minutes', 'remind me', 'not now', 'give me time',
    'few minutes', 'hold on',
    // Hinglish
    'baad mein', 'baad', 'ruko', 'thoda baad', 'thoda der', 'abhi nahi', 'kuch der mein',
    'wait karo',
    // Marathlish
    'nantar', 'thoda nantar', 'raha', 'naatar', 'ata nahi', 'thamba', 'vel de',
    'pudhe ghetli', 'wait karto',
  ],
};

export default VOICE_KEYWORDS;

/**
 * Maps app language codes to BCP-47 locale strings for expo-speech and STT.
 */
export const LOCALE_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
};
