"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "hi";

export interface Translations {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    saved: string;
    saving: string;
    cancel: string;
    close: string;
    delete: string;
    edit: string;
    back: string;
    confirm: string;
    error: string;
    success: string;
    copy: string;
    copied: string;
    search: string;
    viewAll: string;
    readMore: string;
  };
  nav: {
    home: string;
    chat: string;
    gita: string;
    settings: string;
    admin: string;
    profile: string;
    logout: string;
    login: string;
    register: string;
    mainPortal: string;
    adminPortal: string;
    themeToggle: string;
    languageToggle: string;
  };
  auth: {
    welcomeBack: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    loginButton: string;
    registerButton: string;
    orContinueWith: string;
    googleSignIn: string;
    googleSignUp: string;
    noAccount: string;
    haveAccount: string;
    signUpLink: string;
    signInLink: string;
    agreementLabel: string;
    readFullTerms: string;
    termsTitle: string;
    disclaimerTitle: string;
    privacyTitle: string;
    termsNotice: string;
    disclaimerNotice: string;
    privacyNotice: string;
  };
  chat: {
    divineCounsel: string;
    lordKrishna: string;
    seekerInquiry: string;
    newChat: string;
    searchChats: string;
    noChatsFound: string;
    deleteChatConfirm: string;
    inputPlaceholder: string;
    sendButton: string;
    listening: string;
    voiceMode: string;
    speakNow: string;
    suggestedQuestions: string;
    verifiedReferences: string;
    welcomeHeading: string;
    welcomeSubheading: string;
    emptySubtitle: string;
    suggestDuty: string;
    suggestGrief: string;
    suggestPeace: string;
    suggestPurpose: string;
    audioVoiceRecitation: string;
    playAudio: string;
    pauseAudio: string;
  };
  settings: {
    pageTitle: string;
    pageSubtitle: string;
    languageSectionTitle: string;
    languageSectionDesc: string;
    preferredLanguage: string;
    voiceSectionTitle: string;
    voiceSpeed: string;
    autoPlayAudio: string;
    memoryPrivacySectionTitle: string;
    memoryPrivacyDesc: string;
    memoryEnabled: string;
    clearMemories: string;
    saveChanges: string;
  };
  admin: {
    portalTitle: string;
    portalSubtitle: string;
    databaseExplorer: string;
    seekerVault: string;
    conversationsTab: string;
    memoriesTab: string;
    auditLogsTab: string;
    exportAll: string;
    totalUsers: string;
    totalConversations: string;
    totalMessages: string;
    totalMemories: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      appName: "GitaMitra",
      tagline: "Timeless Bhagavad Gita Wisdom for Modern Life",
      loading: "Loading...",
      save: "Save",
      saved: "Saved",
      saving: "Saving...",
      cancel: "Cancel",
      close: "Close",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      confirm: "Confirm",
      error: "An error occurred",
      success: "Action completed successfully",
      copy: "Copy",
      copied: "Copied!",
      search: "Search...",
      viewAll: "View All",
      readMore: "Read More",
    },
    nav: {
      home: "Home",
      chat: "Divine Counsel",
      gita: "Holy Gita",
      settings: "Settings",
      admin: "Admin Command",
      profile: "Seeker Profile",
      logout: "Log Out",
      login: "Sign In",
      register: "Begin Journey",
      mainPortal: "Main Portal",
      adminPortal: "Admin Portal",
      themeToggle: "Toggle Theme",
      languageToggle: "Switch to Hindi",
    },
    auth: {
      welcomeBack: "Welcome Back, Seeker",
      loginSubtitle: "Resume your spiritual walk with the timeless teachings of Bhagavad Gita.",
      registerTitle: "Begin Your Spiritual Walk",
      registerSubtitle: "Create your sacred account to explore personalized wisdom, reflective memory, and divine guidance.",
      fullName: "Full Name",
      fullNamePlaceholder: "e.g., Arjuna",
      email: "Email Address",
      emailPlaceholder: "seeker@gitamitra.org",
      password: "Password",
      passwordPlaceholder: "At least 6 characters",
      loginButton: "Enter Sanctuary",
      registerButton: "Create Seeker Account",
      orContinueWith: "Or continue with",
      googleSignIn: "Sign in with Google",
      googleSignUp: "Sign up with Google",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      signUpLink: "Create an account",
      signInLink: "Sign in here",
      agreementLabel: "I have read and agree to the Terms of Service, conditions, and Important Disclaimers",
      readFullTerms: "Read Full Text",
      termsTitle: "Terms of Service",
      disclaimerTitle: "Important Disclaimers",
      privacyTitle: "Privacy Policy",
      termsNotice: "By creating an account, you agree to respectful usage, non-abuse, and rate limits.",
      disclaimerNotice: "GitaMitra is an AI spiritual companion grounded in the Bhagavad Gita, not a medical or crisis counseling service.",
      privacyNotice: "Your personal inquiries and memories are strictly isolated and never sold.",
    },
    chat: {
      divineCounsel: "Divine Counsel",
      lordKrishna: "Lord Krishna",
      seekerInquiry: "Seeker Inquiry",
      newChat: "New Dialogue",
      searchChats: "Search dialogues (Ctrl+K)...",
      noChatsFound: "No dialogues found",
      deleteChatConfirm: "Are you sure you want to delete this dialogue?",
      inputPlaceholder: "Ask Krishna your deepest questions on life, duty, grief, or purpose...",
      sendButton: "Send Inquiry",
      listening: "Listening with mindful presence...",
      voiceMode: "Voice Guidance",
      speakNow: "Speak to Krishna",
      suggestedQuestions: "Seeker Contemplations",
      verifiedReferences: "Verified Scriptural References",
      welcomeHeading: "Radhe Radhe. How may I guide your spirit today?",
      welcomeSubheading: "Speak freely of your inner battles, duties, uncertainties, or grief. Grounded wisdom from the Bhagavad Gita awaits you.",
      emptySubtitle: "Choose a contemplation or ask what weighs upon your heart.",
      suggestDuty: "How do I perform my duty without anxiety about results?",
      suggestGrief: "How can Gita help me overcome deep sadness or loss?",
      suggestPeace: "How do I calm an agitated, restless mind?",
      suggestPurpose: "What does Krishna say about finding one's true purpose?",
      audioVoiceRecitation: "Listen to Divine Recitation",
      playAudio: "Play Divine Audio",
      pauseAudio: "Pause Audio",
    },
    settings: {
      pageTitle: "Sacred Preferences & Settings",
      pageSubtitle: "Customize your spiritual dialogue experience, language preferences, audio recitations, and memory privacy.",
      languageSectionTitle: "Language & Scriptural Preferences",
      languageSectionDesc: "Choose your primary language for dialogue, UI controls, and Bhagavad Gita reflections.",
      preferredLanguage: "Preferred Dialogue Language",
      voiceSectionTitle: "Voice & Recitation Preferences",
      voiceSpeed: "Voice Speed",
      autoPlayAudio: "Auto-play Divine Recitation Audio",
      memoryPrivacySectionTitle: "Spiritual Memory & Privacy",
      memoryPrivacyDesc: "GitaMitra reflects on your spiritual growth across conversations. You retain 100% sovereignty over your memories.",
      memoryEnabled: "Enable Reflective Memory Extraction",
      clearMemories: "Clear All Stored Memories",
      saveChanges: "Save Preferences",
    },
    admin: {
      portalTitle: "GitaMitra Admin Command Center",
      portalSubtitle: "Master platform controls, full database table explorer, seeker dossier vault, and telemetry.",
      databaseExplorer: "Database Table Explorer",
      seekerVault: "Seeker Vault",
      conversationsTab: "Platform Dialogues",
      memoriesTab: "Extracted Memories",
      auditLogsTab: "Audit Logs",
      exportAll: "Export Full Database (JSON)",
      totalUsers: "Total Seekers",
      totalConversations: "Total Dialogues",
      totalMessages: "Total Messages",
      totalMemories: "Active Memories",
    },
  },
  hi: {
    common: {
      appName: "गीतामित्र",
      tagline: "आधुनिक जीवन के लिए श्रीमद्भगवद्गीता का शाश्वत मार्गदर्शन",
      loading: "प्रतीक्षा करें...",
      save: "सुरक्षित करें",
      saved: "सहेजा गया",
      saving: "सहेजा जा रहा है...",
      cancel: "रद्द करें",
      close: "बंद करें",
      delete: "हटाएं",
      edit: "संपादित करें",
      back: "वापस",
      confirm: "पुष्टि करें",
      error: "त्रुटि उत्पन्न हुई",
      success: "कार्य सफलतापूर्वक पूर्ण हुआ",
      copy: "कॉपी करें",
      copied: "कॉपी हो गया!",
      search: "खोजें...",
      viewAll: "सभी देखें",
      readMore: "और पढ़ें",
    },
    nav: {
      home: "मुख्य पृष्ठ",
      chat: "भगवद् संवाद",
      gita: "श्रीमद्भगवद्गीता",
      settings: "सेटिंग्स",
      admin: "प्रशासन केंद्र",
      profile: "जिज्ञासु प्रोफ़ाइल",
      logout: "लॉग आउट",
      login: "प्रवेश करें",
      register: "यात्रा आरंभ करें",
      mainPortal: "मुख्य पोर्टल",
      adminPortal: "प्रशासन पोर्टल",
      themeToggle: "थीम बदलें",
      languageToggle: "Switch to English",
    },
    auth: {
      welcomeBack: "पुनः स्वागत है, जिज्ञासु",
      loginSubtitle: "श्रीमद्भगवद्गीता के शाश्वत उपदेशों के साथ अपनी आध्यात्मिक यात्रा पुनः प्रारंभ करें।",
      registerTitle: "अपनी आध्यात्मिक यात्रा प्रारंभ करें",
      registerSubtitle: "व्यक्तिगत मार्गदर्शन, आध्यात्मिक चिंतन और भगवद् प्रेरणा प्राप्त करने हेतु खाता बनाएं।",
      fullName: "पूरा नाम",
      fullNamePlaceholder: "उदा., अर्जुन",
      email: "ईमेल पता",
      emailPlaceholder: "seeker@gitamitra.org",
      password: "पासवर्ड",
      passwordPlaceholder: "न्यूनतम 6 अक्षर",
      loginButton: "आश्रम में प्रवेश करें",
      registerButton: "जिज्ञासु खाता बनाएं",
      orContinueWith: "या इसके माध्यम से आगे बढ़ें",
      googleSignIn: "Google से प्रवेश करें",
      googleSignUp: "Google से खाता बनाएं",
      noAccount: "खाता नहीं है?",
      haveAccount: "पहले से खाता है?",
      signUpLink: "नया खाता बनाएं",
      signInLink: "यहाँ प्रवेश करें",
      agreementLabel: "मैंने सेवा की शर्तें, नियम और महत्त्वपूर्ण अस्वीकरण पढ़ लिए हैं और मैं उनसे सहमत हूँ",
      readFullTerms: "पूर्ण विवरण पढ़ें",
      termsTitle: "सेवा की शर्तें",
      disclaimerTitle: "महत्त्वपूर्ण अस्वीकरण",
      privacyTitle: "गोपनीयता नीति",
      termsNotice: "खाता बनाकर, आप आदरपूर्ण उपयोग, दुरुपयोग न करने और सीमा का पालन करने हेतु सहमत होते हैं।",
      disclaimerNotice: "गीतामित्र श्रीमद्भगवद्गीता पर आधारित एक AI आध्यात्मिक मित्र है, यह कोई चिकित्सा अथवा मानसिक परामर्श सेवा नहीं है।",
      privacyNotice: "आपकी व्यक्तिगत जिज्ञासाएँ और स्मृतियाँ पूर्णतः सुरक्षित हैं और कभी किसी को बेची नहीं जातीं।",
    },
    chat: {
      divineCounsel: "भगवद् वाणी",
      lordKrishna: "भगवान श्री कृष्ण",
      seekerInquiry: "जिज्ञासु प्रश्न",
      newChat: "नया संवाद",
      searchChats: "संवाद खोजें (Ctrl+K)...",
      noChatsFound: "कोई संवाद नहीं मिला",
      deleteChatConfirm: "क्या आप वाकई इस संवाद को हटाना चाहते हैं?",
      inputPlaceholder: "जीवन, कर्तव्य, शोक या उद्देश्य पर अपने प्रश्न श्री कृष्ण से पूछें...",
      sendButton: "जिज्ञासा भेजें",
      listening: "सजगता के साथ सुन रहे हैं...",
      voiceMode: "वाणी मार्गदर्शन",
      speakNow: "श्री कृष्ण से बोलकर पूछें",
      suggestedQuestions: "जिज्ञासु चिंतन सूत्र",
      verifiedReferences: "प्रमाणित शास्त्रीय संदर्भ",
      welcomeHeading: "राधे राधे! आज आपके अंतर्मन को क्या मार्गदर्शन चाहिए?",
      welcomeSubheading: "अपने आंतरिक संघर्ष, कर्तव्य, संशय अथवा शोक को निःसंकोच व्यक्त करें। श्रीमद्भगवद्गीता का अमृतमय ज्ञान आपके साथ है।",
      emptySubtitle: "नीचे दिए गए चिंतन सूत्रों में से चुनें अथवा अपने हृदय की बात पूछें।",
      suggestDuty: "फल की चिंता किए बिना मैं निष्काम कर्म कैसे करूँ?",
      suggestGrief: "गहरे दुःख और आघात से उबरने में गीता मेरी क्या सहायता कर सकती है?",
      suggestPeace: "अशांत और चंचल मन को वश में कैसे किया जाए?",
      suggestPurpose: "स्वधर्म और जीवन के वास्तविक उद्देश्य के विषय में श्री कृष्ण क्या कहते हैं?",
      audioVoiceRecitation: "दिव्य वाणी पाठ सुनें",
      playAudio: "दिव्य वाणी सुनें",
      pauseAudio: "रोकें",
    },
    settings: {
      pageTitle: "आध्यात्मिक प्राथमिकताएँ एवं सेटिंग्स",
      pageSubtitle: "अपने संवाद, भाषा प्राथमिकता, वाणी उच्चारण और स्मृति गोपनीयता को अनुकूलित करें।",
      languageSectionTitle: "भाषा एवं शास्त्रीय प्राथमिकता",
      languageSectionDesc: "संवाद, इंटरफेस और गीता चिंतन के लिए अपनी मुख्य भाषा चुनें।",
      preferredLanguage: "मार्गदर्शन भाषा",
      voiceSectionTitle: "वाणी एवं पाठ प्राथमिकताएँ",
      voiceSpeed: "वाणी की गति",
      autoPlayAudio: "दिव्य पाठ स्वतः चलाएँ",
      memoryPrivacySectionTitle: "आध्यात्मिक स्मृति एवं गोपनीयता",
      memoryPrivacyDesc: "गीतामित्र विभिन्न संवादों में आपकी आध्यात्मिक प्रगति को संजोता है। अपनी स्मृतियों पर आपका 100% अधिकार है।",
      memoryEnabled: "प्रतिबिंबित स्मृति संचयन सक्षम करें",
      clearMemories: "सभी संचित स्मृतियाँ मिटाएँ",
      saveChanges: "प्राथमिकताएँ सहेजें",
    },
    admin: {
      portalTitle: "गीतामित्र प्रशासन नियंत्रण कक्ष",
      portalSubtitle: "प्लेटफ़ॉर्म नियंत्रण, संपूर्ण डेटाबेस तालिका अन्वेषक, जिज्ञासु रिकॉर्ड और टेलीमेट्री।",
      databaseExplorer: "डेटाबेस तालिका अन्वेषक",
      seekerVault: "जिज्ञासु वॉल्ट",
      conversationsTab: "मंच संवाद",
      memoriesTab: "संचित स्मृतियाँ",
      auditLogsTab: "ऑडिट लॉग",
      exportAll: "संपूर्ण डेटाबेस निर्यात करें (JSON)",
      totalUsers: "कुल जिज्ञासु",
      totalConversations: "कुल संवाद",
      totalMessages: "कुल संदेश",
      totalMemories: "सक्रिय स्मृतियाँ",
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Check local storage
    const saved = localStorage.getItem("gitamitra_language") as Language | null;
    if (saved === "hi" || saved === "en") {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    } else {
      // 2. Check browser language
      const browserLang = navigator.language?.toLowerCase() || "";
      if (browserLang.startsWith("hi")) {
        setLanguageState("hi");
        document.documentElement.lang = "hi";
      } else {
        setLanguageState("en");
        document.documentElement.lang = "en";
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("gitamitra_language", lang);
    localStorage.setItem("gitamitra_preferred_lang", lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "hi" : "en";
    setLanguage(next);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
        isHindi: language === "hi",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function LanguageSwitcherButton({ className = "" }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      type="button"
      title={language === "en" ? "Switch to Hindi (हिन्दी)" : "Switch to English"}
      aria-label="Toggle language"
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-serif border transition-all duration-200 cursor-pointer shadow-xs ${
        language === "hi"
          ? "bg-amber-600/15 text-amber-900 dark:text-amber-300 border-amber-500/40 hover:bg-amber-600/25"
          : "bg-stone-200/60 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-300/60 dark:hover:bg-stone-700"
      } ${className}`}
    >
      <span className={language === "en" ? "font-bold text-amber-700 dark:text-amber-400" : "text-stone-400"}>
        EN
      </span>
      <span className="text-stone-400 dark:text-stone-600">|</span>
      <span className={language === "hi" ? "font-bold text-amber-700 dark:text-amber-400 font-sans" : "text-stone-400"}>
        हिन्दी
      </span>
    </button>
  );
}
