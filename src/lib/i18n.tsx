"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "en" | "hi" | "ta" | "te";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    citizen: "Citizen",
    dashboard: "Dashboard",
    supervisor: "Supervisor",
    worker: "Worker",
    submitGrievance: "Submit a Grievance",
    describeIssue: "Describe your issue",
    describePlaceholder: "e.g. No water supply in Sector 5 since yesterday...",
    location: "Location (optional)",
    locationPlaceholder: "Area, ward, landmark",
    yourName: "Your name (optional)",
    contact: "Contact (optional)",
    contactPlaceholder: "Phone or email",
    photo: "Photo (optional)",
    takePhoto: "Take Photo",
    analyzing: "Analyzing...",
    imageAttached: "Image attached",
    aiGeneratedEdit: "AI generated from your photo — edit above if needed.",
    submitButton: "Submit Grievance",
    trackGrievance: "Track Your Grievance",
    ticketId: "Ticket ID",
    ticketIdPlaceholder: "e.g. GRV-A1B2C3D4",
    checkStatus: "Check Status",
    speakIssue: "Speak your issue",
    listening: "Listening...",
    stopListening: "Stop",
  },
  hi: {
    citizen: "नागरिक",
    dashboard: "डैशबोर्ड",
    supervisor: "पर्यवेक्षक",
    worker: "कर्मचारी",
    submitGrievance: "शिकायत दर्ज करें",
    describeIssue: "अपनी समस्या बताएं",
    describePlaceholder: "जैसे पानी नहीं आ रहा...",
    location: "स्थान (वैकल्पिक)",
    locationPlaceholder: "इलाका, वार्ड",
    yourName: "आपका नाम (वैकल्पिक)",
    contact: "संपर्क (वैकल्पिक)",
    contactPlaceholder: "फोन या ईमेल",
    photo: "फोटो (वैकल्पिक)",
    takePhoto: "फोटो लें",
    analyzing: "विश्लेषण हो रहा है...",
    imageAttached: "छवि जोड़ी गई",
    aiGeneratedEdit: "आपकी फोटो से AI ने लिखा — जरूरत हो तो ऊपर संपादित करें।",
    submitButton: "शिकायत भेजें",
    trackGrievance: "शिकायत की स्थिति देखें",
    ticketId: "टिकट आईडी",
    ticketIdPlaceholder: "जैसे GRV-A1B2C3D4",
    checkStatus: "स्थिति देखें",
    speakIssue: "बोलकर बताएं",
    listening: "सुन रहे हैं...",
    stopListening: "रोकें",
  },
  ta: {
    citizen: "குடிமகன்",
    dashboard: "டாஷ்போர்டு",
    supervisor: "மேற்பார்வையாளர்",
    worker: "பணியாளர்",
    submitGrievance: "புகார் சமர்ப்பிக்கவும்",
    describeIssue: "உங்கள் சிக்கலை விவரிக்கவும்",
    describePlaceholder: "எ.கா. நீர் வ supplyட்டணை இல்லை...",
    location: "இடம் (விரும்பினால்)",
    locationPlaceholder: "பகுதி, வார்டு",
    yourName: "உங்கள் பெயர் (விரும்பினால்)",
    contact: "தொடர்பு (விரும்பினால்)",
    contactPlaceholder: "தொலைபேசி அல்லது மின்னஞ்சல்",
    photo: "படம் (விரும்பினால்)",
    takePhoto: "படம் எடு",
    analyzing: "பகுப்பாய்வு செய்கிறது...",
    imageAttached: "படம் இணைக்கப்பட்டது",
    aiGeneratedEdit: "உங்கள் படத்திலிருந்து AI எழுதியது — தேவைப்பட்டால் மேலே திருத்தவும்.",
    submitButton: "புகார் சமர்ப்பி",
    trackGrievance: "புகார் நிலையை பார்க்கவும்",
    ticketId: "டிக்கெட் ஐடி",
    ticketIdPlaceholder: "எ.கா. GRV-A1B2C3D4",
    checkStatus: "நிலை பார்க்க",
    speakIssue: "பேசி சொல்லுங்கள்",
    listening: "கேட்கிறோம்...",
    stopListening: "நிறுத்து",
  },
  te: {
    citizen: "పౌరుడు",
    dashboard: "డాష్‌బోర్డ్",
    supervisor: "పర్యవేక్షకుడు",
    worker: "కార్మికుడు",
    submitGrievance: "ఫిర్యాదు సమర్పించండి",
    describeIssue: "మీ సమస్యను వివరించండి",
    describePlaceholder: "ఉదా. నీటి సరఫరా లేదు...",
    location: "స్థానం (ఐచ్ఛికం)",
    locationPlaceholder: "ప్రాంతం, వార్డు",
    yourName: "మీ పేరు (ఐచ్ఛికం)",
    contact: "సంప్రదించండి (ఐచ్ఛికం)",
    contactPlaceholder: "ఫోన్ లేదా ఇమెయిల్",
    photo: "ఫోటో (ఐచ్ఛికం)",
    takePhoto: "ఫోటో తీయండి",
    analyzing: "విశ్లేషిస్తోంది...",
    imageAttached: "చిత్రం జోడించబడింది",
    aiGeneratedEdit: "మీ ఫోటో నుండి AI రాశారు — అవసరమైతే పైన సవరించండి.",
    submitButton: "ఫిర్యాదు సమర్పించండి",
    trackGrievance: "ఫిర్యాదు స్థితిని తనిఖీ చేయండి",
    ticketId: "టికెట్ ఐడి",
    ticketIdPlaceholder: "ఉదా. GRV-A1B2C3D4",
    checkStatus: "స్థితి తనిఖీ",
    speakIssue: "మాట్లాడి చెప్పండి",
    listening: "వినడం...",
    stopListening: "ఆపు",
  },
};

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
} | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations.en[key] ?? key,
    [lang]
  );
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) return { lang: "en" as Lang, setLang: () => {}, t: (k: string) => k };
  return ctx;
}
