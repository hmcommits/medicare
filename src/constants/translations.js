/**
 * MediCare i18n translation strings.
 * Supports English (en), Hindi (hi), Marathi (mr).
 *
 * Function-type values are called by the `t(key, ...args)` helper in LanguageContext.
 */
const translations = {
  en: {
    // ── Onboarding ────────────────────────────────────────────────────
    selectLanguage: 'Select Your Language',
    languageSubtitle: 'Choose your preferred language.\nThis affects the app UI, voice assistant, and notifications.',
    continue: 'Continue',

    // ── Auth ──────────────────────────────────────────────────────────
    welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to continue',
    emailAddress: 'Email address',
    password: 'Password',
    signIn: 'Sign In',
    newToMedicare: 'NEW TO MEDICARE?',
    registerAsPatient: 'Register as Patient',
    registerAsGuardian: 'Register as Guardian',
    joinMedicare: 'Join MediCare',
    createAccount: 'Create Account',
    confirmPassword: 'Confirm Password',
    backToSignIn: 'Back to Sign In',
    patientAccount: '  Patient Account  ',
    guardianAccount: '  Guardian Account  ',

    // ── Dashboard ─────────────────────────────────────────────────────
    goodDay: 'Good day!',
    guardianView: 'Guardian View',
    dashboard: 'Dashboard',
    medicines: 'Medicines',
    today: 'Today',
    tookToday: 'Took Today',
    scheduledMedicines: 'Scheduled Medicines',
    addNewMedicine: 'Add New Medicine',
    allClear: 'All clear!',
    noMedicinesYet: "No medicines scheduled yet.\nAdd your first one below.",
    sevenDayAdherence: '7-Day Adherence',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity.',
    noDataYet: 'No data yet',
    edit: 'Edit',
    done: 'Done',

    // ── Inventory / Refill ────────────────────────────────────────────
    refillSoon: 'Refill Soon',
    daysLeft: (n) => `~${n} days left`,
    refilled: 'Refilled ✓',
    enableInventory: 'Enable inventory tracking for refill reminders',
    howManyPillsAdded: 'How many pills did you add?',
    update: 'Update',
    cancel: 'Cancel',

    // ── Streak ────────────────────────────────────────────────────────
    dayStreak: (n) => `${n}-Day Streak`,
    streakSaved: 'Streak Saved! 🛡️',
    freezeRemaining: '1 freeze left this month',
    freezeUsed: 'No freezes left this month',
    startYourStreak: 'Take your first medicine to start a streak!',
    badgesUnlocked: 'Badges',

    // ── Guardian High-Five ────────────────────────────────────────────
    patientHitStreak: (name, days) => `🔥 ${name} just hit a ${days}-day streak!`,
    sendHighFive: 'Send High-Five 🙌',
    highFiveSent: 'High-Five sent!',

    // ── Add Medicine ──────────────────────────────────────────────────
    addMedicine: 'Add Medicine',
    setUpSchedule: 'Set up your medication schedule',
    medicationDetails: 'Medication Details',
    medicineName: 'Medicine Name',
    searchMedicineName: 'Type to search medicine name...',
    dosage: 'Dosage',
    repeatSchedule: 'Repeat Schedule',
    reminderTimes: 'Reminder Times',
    addAnotherTime: 'Add Another Time',
    saveMedicine: 'Save Medicine',
    missingInfo: 'Missing Info',
    noSuggestions: 'No suggestions. Type your own name.',
    medicineInfo: 'Drug Info',
    usage: 'Usage',
    standardDosage: 'Standard Dosage',
    warnings: 'Warnings (tap to expand)',
    fetchingInfo: 'Fetching drug info...',

    // ── Inventory fields ─────────────────────────────────────────────
    inventoryOptional: 'Inventory Tracking (Optional)',
    inventoryHint: 'Enable to get low-stock refill reminders',
    pillsInStock: 'Pills currently in stock',
    pillsPerDose: 'Pills taken per dose',
    refillLeadTime: 'Remind me when X days of supply remain',
    defaultLeadTime: '7',

    // ── Voice ────────────────────────────────────────────────────────
    voiceAssistant: 'Voice',
    listening: 'Listening…',
    voiceError: 'Could not understand. Please try again.',
    todaysMedicines: "Today's Medicines",
    noMedicinesToday: 'No medicines scheduled for today.',

    // ── Notifications ─────────────────────────────────────────────────
    notifMedTitle: '💊 Time for your medicine!',
    notifRefillTitle: '⚠️ Time to refill!',
    notifRefillBody: (name, days) => `Running low on ${name} — ~${days} days left. Time to reorder!`,
    notifHighFivePromptTitle: '🔥 Milestone Alert!',
    notifHighFivePromptBody: (days) => `Your patient just hit a ${days}-day streak!`,
    notifHighFiveTitle: '🙌 High-Five from your Guardian!',
    notifHighFiveBody: 'Keep it up! Your guardian is cheering for you.',
  },

  hi: {
    // ── Onboarding ────────────────────────────────────────────────────
    selectLanguage: 'अपनी भाषा चुनें',
    languageSubtitle: 'अपनी पसंदीदा भाषा चुनें।\nइससे ऐप UI, वॉइस असिस्टेंट और नोटिफिकेशन प्रभावित होंगे।',
    continue: 'जारी रखें',

    // ── Auth ──────────────────────────────────────────────────────────
    welcomeBack: 'वापसी पर स्वागत है',
    signInToContinue: 'जारी रखने के लिए साइन इन करें',
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड',
    signIn: 'साइन इन करें',
    newToMedicare: 'MEDICARE पर नए हैं?',
    registerAsPatient: 'मरीज़ के रूप में रजिस्टर करें',
    registerAsGuardian: 'अभिभावक के रूप में रजिस्टर करें',
    joinMedicare: 'MediCare से जुड़ें',
    createAccount: 'अकाउंट बनाएं',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    backToSignIn: 'साइन इन पर वापस जाएं',
    patientAccount: '  मरीज़ अकाउंट  ',
    guardianAccount: '  अभिभावक अकाउंट  ',

    // ── Dashboard ─────────────────────────────────────────────────────
    goodDay: 'नमस्ते!',
    guardianView: 'अभिभावक दृश्य',
    dashboard: 'डैशबोर्ड',
    medicines: 'दवाइयाँ',
    today: 'आज',
    tookToday: 'आज ली',
    scheduledMedicines: 'निर्धारित दवाइयाँ',
    addNewMedicine: 'नई दवा जोड़ें',
    allClear: 'सब ठीक है!',
    noMedicinesYet: 'अभी कोई दवा नहीं।\nनीचे से पहली दवा जोड़ें।',
    sevenDayAdherence: '7 दिन का अनुपालन',
    recentActivity: 'हाल की गतिविधि',
    noRecentActivity: 'कोई हालिया गतिविधि नहीं।',
    noDataYet: 'अभी कोई डेटा नहीं',
    edit: 'संपादित करें',
    done: 'हो गया',

    // ── Inventory / Refill ────────────────────────────────────────────
    refillSoon: 'जल्द रिफिल करें',
    daysLeft: (n) => `~${n} दिन बाकी`,
    refilled: 'रिफिल किया ✓',
    enableInventory: 'रिफिल रिमाइंडर के लिए इन्वेंटरी ट्रैकिंग चालू करें',
    howManyPillsAdded: 'कितनी गोलियाँ जोड़ीं?',
    update: 'अपडेट करें',
    cancel: 'रद्द करें',

    // ── Streak ────────────────────────────────────────────────────────
    dayStreak: (n) => `${n} दिन की स्ट्रीक`,
    streakSaved: 'स्ट्रीक बची! 🛡️',
    freezeRemaining: 'इस महीने 1 फ्रीज बाकी है',
    freezeUsed: 'इस महीने कोई फ्रीज नहीं बचा',
    startYourStreak: 'स्ट्रीक शुरू करने के लिए पहली दवा लें!',
    badgesUnlocked: 'बैज',

    // ── Guardian High-Five ────────────────────────────────────────────
    patientHitStreak: (name, days) => `🔥 ${name} ने ${days} दिन की स्ट्रीक हासिल की!`,
    sendHighFive: 'हाई-फाइव भेजें 🙌',
    highFiveSent: 'हाई-फाइव भेज दिया!',

    // ── Add Medicine ──────────────────────────────────────────────────
    addMedicine: 'दवा जोड़ें',
    setUpSchedule: 'अपना दवा कार्यक्रम सेट करें',
    medicationDetails: 'दवा की जानकारी',
    medicineName: 'दवा का नाम',
    searchMedicineName: 'दवा का नाम खोजने के लिए टाइप करें...',
    dosage: 'खुराक',
    repeatSchedule: 'दोहराने का समय',
    reminderTimes: 'रिमाइंडर समय',
    addAnotherTime: 'और समय जोड़ें',
    saveMedicine: 'दवा सेव करें',
    missingInfo: 'जानकारी अधूरी है',
    noSuggestions: 'कोई सुझाव नहीं। अपना नाम लिखें।',
    medicineInfo: 'दवा की जानकारी',
    usage: 'उपयोग',
    standardDosage: 'सामान्य खुराक',
    warnings: 'चेतावनियाँ (टैप करें)',
    fetchingInfo: 'दवा की जानकारी ला रहे हैं...',

    // ── Inventory fields ──────────────────────────────────────────────
    inventoryOptional: 'इन्वेंटरी ट्रैकिंग (वैकल्पिक)',
    inventoryHint: 'कम स्टॉक पर रिफिल रिमाइंडर पाने के लिए चालू करें',
    pillsInStock: 'अभी कितनी गोलियाँ हैं',
    pillsPerDose: 'प्रति खुराक गोलियाँ',
    refillLeadTime: 'X दिन बाकी रहने पर याद दिलाएं',
    defaultLeadTime: '7',

    // ── Voice ────────────────────────────────────────────────────────
    voiceAssistant: 'आवाज़',
    listening: 'सुन रहा हूँ…',
    voiceError: 'समझ नहीं आया। फिर कोशिश करें।',
    todaysMedicines: 'आज की दवाइयाँ',
    noMedicinesToday: 'आज कोई दवा निर्धारित नहीं।',

    // ── Notifications ─────────────────────────────────────────────────
    notifMedTitle: '💊 दवा का समय हो गया!',
    notifRefillTitle: '⚠️ रिफिल का समय!',
    notifRefillBody: (name, days) => `${name} की गोलियाँ कम हो रही हैं — ~${days} दिन बाकी!`,
    notifHighFivePromptTitle: '🔥 माइलस्टोन अलर्ट!',
    notifHighFivePromptBody: (days) => `आपके मरीज़ ने ${days} दिन की स्ट्रीक हासिल की!`,
    notifHighFiveTitle: '🙌 अभिभावक का हाई-फाइव!',
    notifHighFiveBody: 'बहुत अच्छा! आपके अभिभावक आपके लिए खुश हैं।',
  },

  mr: {
    // ── Onboarding ────────────────────────────────────────────────────
    selectLanguage: 'तुमची भाषा निवडा',
    languageSubtitle: 'तुमची आवडती भाषा निवडा।\nयाचा परिणाम ॲप UI, व्हॉइस असिस्टंट आणि नोटिफिकेशनवर होईल।',
    continue: 'पुढे चला',

    // ── Auth ──────────────────────────────────────────────────────────
    welcomeBack: 'परत आलात, स्वागत आहे',
    signInToContinue: 'पुढे जाण्यासाठी साइन इन करा',
    emailAddress: 'ईमेल पत्ता',
    password: 'पासवर्ड',
    signIn: 'साइन इन करा',
    newToMedicare: 'MEDICARE वर नवीन आहात?',
    registerAsPatient: 'रुग्ण म्हणून नोंदणी करा',
    registerAsGuardian: 'पालक म्हणून नोंदणी करा',
    joinMedicare: 'MediCare मध्ये सामील व्हा',
    createAccount: 'अकाउंट तयार करा',
    confirmPassword: 'पासवर्ड पुष्टी करा',
    backToSignIn: 'साइन इनवर परत जा',
    patientAccount: '  रुग्ण अकाउंट  ',
    guardianAccount: '  पालक अकाउंट  ',

    // ── Dashboard ─────────────────────────────────────────────────────
    goodDay: 'नमस्कार!',
    guardianView: 'पालक दृश्य',
    dashboard: 'डॅशबोर्ड',
    medicines: 'औषधे',
    today: 'आज',
    tookToday: 'आज घेतली',
    scheduledMedicines: 'नियोजित औषधे',
    addNewMedicine: 'नवीन औषध जोडा',
    allClear: 'सर्व ठीक आहे!',
    noMedicinesYet: 'अजून कोणतीही औषधे नाहीत।\nखाली पहिले औषध जोडा।',
    sevenDayAdherence: '७-दिवसांचे पालन',
    recentActivity: 'अलीकडील क्रियाकलाप',
    noRecentActivity: 'कोणताही अलीकडील क्रियाकलाप नाही.',
    noDataYet: 'अजून डेटा नाही',
    edit: 'संपादित करा',
    done: 'झाले',

    // ── Inventory / Refill ────────────────────────────────────────────
    refillSoon: 'लवकर रिफिल करा',
    daysLeft: (n) => `~${n} दिवस शिल्लक`,
    refilled: 'रिफिल केले ✓',
    enableInventory: 'रिफिल स्मरणपत्रासाठी यादी ट्रॅकिंग सुरू करा',
    howManyPillsAdded: 'किती गोळ्या जोडल्या?',
    update: 'अपडेट करा',
    cancel: 'रद्द करा',

    // ── Streak ────────────────────────────────────────────────────────
    dayStreak: (n) => `${n}-दिवसांची स्ट्रीक`,
    streakSaved: 'स्ट्रीक वाचली! 🛡️',
    freezeRemaining: 'या महिन्यात १ फ्रीज शिल्लक',
    freezeUsed: 'या महिन्यात फ्रीज शिल्लक नाही',
    startYourStreak: 'स्ट्रीक सुरू करण्यासाठी पहिले औषध घ्या!',
    badgesUnlocked: 'बॅज',

    // ── Guardian High-Five ────────────────────────────────────────────
    patientHitStreak: (name, days) => `🔥 ${name} ने ${days}-दिवसांची स्ट्रीक मिळवली!`,
    sendHighFive: 'हाय-फाइव्ह पाठवा 🙌',
    highFiveSent: 'हाय-फाइव्ह पाठवला!',

    // ── Add Medicine ──────────────────────────────────────────────────
    addMedicine: 'औषध जोडा',
    setUpSchedule: 'तुमचे औषध वेळापत्रक सेट करा',
    medicationDetails: 'औषधाची माहिती',
    medicineName: 'औषधाचे नाव',
    searchMedicineName: 'औषधाचे नाव शोधण्यासाठी टाइप करा...',
    dosage: 'डोस',
    repeatSchedule: 'पुनरावृत्ती वेळापत्रक',
    reminderTimes: 'स्मरणपत्र वेळ',
    addAnotherTime: 'आणखी वेळ जोडा',
    saveMedicine: 'औषध जतन करा',
    missingInfo: 'माहिती अपूर्ण आहे',
    noSuggestions: 'कोणतेही सुझाव नाही. स्वतःचे नाव लिहा.',
    medicineInfo: 'औषधाची माहिती',
    usage: 'वापर',
    standardDosage: 'मानक डोस',
    warnings: 'इशारे (टॅप करा)',
    fetchingInfo: 'औषधाची माहिती आणत आहे...',

    // ── Inventory fields ──────────────────────────────────────────────
    inventoryOptional: 'यादी ट्रॅकिंग (ऐच्छिक)',
    inventoryHint: 'कमी साठ्यावर रिफिल स्मरणपत्र मिळवण्यासाठी सुरू करा',
    pillsInStock: 'सध्या किती गोळ्या आहेत',
    pillsPerDose: 'प्रति डोस गोळ्या',
    refillLeadTime: 'X दिवस शिल्लक असताना आठवण द्या',
    defaultLeadTime: '7',

    // ── Voice ────────────────────────────────────────────────────────
    voiceAssistant: 'आवाज',
    listening: 'ऐकतोय…',
    voiceError: 'समजले नाही. पुन्हा प्रयत्न करा.',
    todaysMedicines: 'आजची औषधे',
    noMedicinesToday: 'आज कोणतीही औषधे नियोजित नाहीत.',

    // ── Notifications ─────────────────────────────────────────────────
    notifMedTitle: '💊 औषध घेण्याची वेळ!',
    notifRefillTitle: '⚠️ रिफिल करण्याची वेळ!',
    notifRefillBody: (name, days) => `${name} च्या गोळ्या कमी होत आहेत — ~${days} दिवस शिल्लक!`,
    notifHighFivePromptTitle: '🔥 माइलस्टोन अलर्ट!',
    notifHighFivePromptBody: (days) => `तुमच्या रुग्णाने ${days}-दिवसांची स्ट्रीक मिळवली!`,
    notifHighFiveTitle: '🙌 पालकाचा हाय-फाइव्ह!',
    notifHighFiveBody: 'खूप छान! तुमच्या पालकांना तुमचा अभिमान आहे.',
  },
};

export default translations;
