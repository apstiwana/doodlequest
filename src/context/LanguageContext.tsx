import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "nl";

export const translations = {
  en: {
    // WelcomeScreen
    tagline: "Bring your drawings to life! 🌟",
    whatIsYourName: "What's your name? 👋",
    nameWillCall: "Your drawing will call you by name!",
    namePlaceholder: "Type your name here...",
    startAdventure: "Start Adventure!",
    bottomHint: "🖼️ Upload a drawing • 🌍 Explore 5 worlds • 💬 Chat with your character",

    // DrawingUpload
    uploadTitle: "Upload Your Drawing!",
    uploadSubtitle: (name: string) => `${name}, let's bring your creation to life! ✨`,
    dropHere: "Drop your drawing here!",
    dropActive: "Drop it here! 🎯",
    orClickToChoose: "or click to choose a photo",
    choosePhoto: "Choose Photo",
    worksbestHint: "Works best with drawings on white paper 📄",
    makingMagic: "Making your drawing magic!",
    justAMoment: "Just a moment... 🪄",
    lookingAmazing: (name: string) => `Looking amazing, ${name}!`,
    tryAgain: "Try Again",
    letsGo: "Let's Go!",
    errorNotImage: "Please upload an image file! 🖼️",
    errorTooBig: "Image is too big! Please use a smaller one. 📏",

    // GameStage
    talkToCharacter: "💬 Talk to your character!",
    saySomething: "Say something...",
    send: "Send",
    controlsHint: "← → Move • ↑ / Space Jump • T Chat",

    // SceneSelector scene labels
    sceneForest: "Forest",
    sceneUnderwater: "Underwater",
    sceneCity: "City",
    sceneMoon: "Moon",
    sceneSpace: "Space",

    // CharacterCustomizer
    customizeTitle: "Customize Your Character!",
    customizeSubtitle: (name: string) => `${name}, make your hero unique! 🎨`,
    customizeColor: "Colour",
    customizeSize: "Size in game",
    customizeTiny: "Tiny",
    customizeGiant: "Giant",

    // Language toggle
    langLabel: "Language",
  },
  nl: {
    // WelcomeScreen
    tagline: "Breng je tekeningen tot leven! 🌟",
    whatIsYourName: "Wat is jouw naam? 👋",
    nameWillCall: "Je tekening noemt je bij naam!",
    namePlaceholder: "Typ hier jouw naam...",
    startAdventure: "Begin het avontuur!",
    bottomHint: "🖼️ Upload een tekening • 🌍 Verken 5 werelden • 💬 Chat met je personage",

    // DrawingUpload
    uploadTitle: "Upload jouw tekening!",
    uploadSubtitle: (name: string) => `${name}, laten we jouw creatie tot leven brengen! ✨`,
    dropHere: "Sleep jouw tekening hierheen!",
    dropActive: "Laat het hier vallen! 🎯",
    orClickToChoose: "of klik om een foto te kiezen",
    choosePhoto: "Kies foto",
    worksbestHint: "Werkt het beste met tekeningen op wit papier 📄",
    makingMagic: "Jouw tekening wordt magisch!",
    justAMoment: "Even geduld... 🪄",
    lookingAmazing: (name: string) => `Wauw, geweldig, ${name}!`,
    tryAgain: "Opnieuw proberen",
    letsGo: "Let's Go!",
    errorNotImage: "Upload een afbeeldingsbestand! 🖼️",
    errorTooBig: "De afbeelding is te groot! Gebruik een kleinere. 📏",

    // GameStage
    talkToCharacter: "💬 Praat met jouw personage!",
    saySomething: "Zeg iets...",
    send: "Sturen",
    controlsHint: "← → Bewegen • ↑ / Spatie Springen • T Chat",

    // SceneSelector scene labels
    sceneForest: "Woud",
    sceneUnderwater: "Onderwater",
    sceneCity: "Stad",
    sceneMoon: "Maan",
    sceneSpace: "Ruimte",

    // Language toggle
    langLabel: "Taal",
  },
};

type Translations = typeof translations.en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
