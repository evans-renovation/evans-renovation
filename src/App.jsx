import React, { useState, useEffect } from 'react';
import { 
  Hammer, Paintbrush, Ruler, Phone, Mail, MapPin, 
  ChevronRight, Menu, X, Facebook, Instagram, 
  Sparkles, Send, Loader2, Construction, CheckCircle2
} from 'lucide-react';
import ClientPortal from './ClientPortal';

/**
 * EVANS RÉNOVATION WEBSITE
 * ------------------------
 * A responsive React application tailored for a renovation business in France.
 * Features:
 * - Modern Hero Section
 * - Services Breakdown
 * - Project Portfolio (Grid)
 * - AI Renovation Roadmap Generator (Gemini API)
 * - Contact Form
 */

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // NEW: Language State ('en' for English, 'fr' for French)
const [language, setLanguage] = useState('en');

  const [isPortalOpen, setIsPortalOpen] = useState(false);
  
  // --- AI Feature State ---
  const [projectInput, setProjectInput] = useState('');
  const [aiOutput, setAiOutput] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // IMPORTANT: For local use, paste your API key inside the quotes below.
  // Get one here: https://aistudio.google.com/app/apikey
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Handle scroll effects for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Gemini API Logic ---
  const fetchGemini = async (prompt, systemInstruction) => {
    // If no key is provided, show a friendly error
    if (!apiKey) {
      throw new Error("API Key missing. Please add your key in App.jsx to use AI features.");
    }

    let delay = 1000;
    // Exponential backoff strategy for robustness
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          })
        });
        
        if (!response.ok) throw new Error('API Request Failed');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        if (i === 2) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!projectInput.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiOutput(null);

    // Inside handleGenerateRoadmap function...

// Define prompts for both languages
const prompts = {
  en: "You are a senior renovation consultant for 'Evans Rénovation' in France. The client will describe a project idea below. Generate a customized 5-step roadmap SPECIFIC to their request. If the project is simple (e.g., painting), focus on surface prep and finishes. If it is complex (e.g., extensions), include Mairie permissions and structural checks. Do NOT force steps that are irrelevant to the user's input. Keep it professional, encouraging, and mention French specificities only if applicable. IMPORTANT: Respond ONLY in English. Do NOT use Markdown formatting.",
  
  fr: "Vous êtes un consultant expert pour 'Evans Rénovation' en France. Le client décrira une idée de projet ci-dessous. Générez une feuille de route de 5 étapes personnalisée et SPÉCIFIQUE à leur demande. Si le projet est simple (ex: peinture), concentrez-vous sur la préparation et les finitions. Si complexe (ex: extension), incluez les permis Mairie et la structure. NE forcez PAS des étapes non pertinentes. Soyez professionnel et encourageant. IMPORTANT : Répondez UNIQUEMENT en français. N'utilisez PAS de formatage Markdown."
};

// Select the prompt based on the current language setting
const systemPrompt = prompts[language];

// ... then call fetchGemini(..., systemPrompt) as usual
    
    try {
      const result = await fetchGemini(`Client Project Idea: ${projectInput}`, systemPrompt);
      setAiOutput(result);
    } catch (err) {
      console.error(err);
      setAiError(err.message.includes("Key") ? "Missing API Key (Check App.jsx)" : "Service momentarily unavailable. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };
  const translations = {
    en: {
      // Navbar
      nav_portfolio: "Portfolio",
      nav_services: "Services",
      nav_workshop: "AI Workshop",
      nav_contact: "Contact Us",
      
      // Hero Section
      hero_badge: "Based in Charente & Dordogne",
      hero_title_1: "Breathing new",
      hero_title_2: "Life",
      hero_title_3: "into old Stone.",
      hero_desc: "Combining a deep understanding of local buildings with a friendly, can-do attitude to manage your renovation from the first challenge to the final finish.",
      hero_btn_work: "View Our Work",
      hero_btn_ai: "Plan with AI",

      // AI Workshop
      ai_label: "Digital Consultant",
      ai_title: "Visualize your project before we break ground.",
      ai_desc: "Renovating in France involves specific regulations and stages. Describe your rough idea here, and our AI tool will generate a structured, professional roadmap to help you understand the scope.",
      ai_point_1: "Receive a 5-step breakdown",
      ai_point_2: "Understand French terminology",
      ai_point_3: "Instant, free preliminary advice",
      ai_input_label: "Describe your project idea",
      ai_placeholder: "e.g., I want to convert an old stone barn near Ribérac into a 3-bedroom gîte with a mezzanine...",
      ai_btn_generate: "Generate Roadmap",
      ai_btn_loading: "Analyzing Request...",
      ai_output_title: "Recommended Roadmap",

      // Services
      serv_eyebrow: "Our Expertise",
      serv_title: "Twenty years of local building knowledge applied to every detail",
      serv_1_title: "Total Renovation",
      serv_1_desc: "We manage your entire project from start to finish, applying local insight to navigate regulations and restore your property.",
      serv_2_title: "Kitchens & Bathrooms",
      serv_2_desc: "We design and install reliable, high-performance bathrooms and kitchens that work perfectly and look stunning.",
      serv_3_title: "Structural & Masonry",
      serv_3_desc: "Structural work and masonry repairs handled with the precision and understanding that local buildings require.",

      // Portfolio
      port_title: "Recent Projects",
      port_link: "View Instagram",

      proj_1_title: "Barn Conversion",
      proj_1_type: "Full Build",
      proj_2_title: "Farmhouse Kitchen",
      proj_2_type: "Interior",
      proj_3_title: "Pool House",
      proj_3_type: "Extension",
      proj_4_title: "Townhouse Reno",
      proj_4_type: "Restoration",
      
      // Contact
      cont_title: "Ready to discuss your project?",
      cont_desc: "Whether it's a small repair or a full conversion, get in touch with Evans Renovation today.",
      cont_call: "Call Us",
      cont_email: "Email Us",
      form_name: "Name",
      form_phone: "Phone",
      form_email: "Email Address",
      form_msg: "Tell us about your project...",
      form_btn: "Send Message"
    },
    fr: {
      // Navbar
      nav_portfolio: "Portfolio",
      nav_services: "Services",
      nav_workshop: "Atelier IA",
      nav_contact: "Contactez-nous",
      
      // Hero Section
      hero_badge: "Basé en Charente et Dordogne",
      hero_title_1: "Redonner",
      hero_title_2: "Vie",
      hero_title_3: "à la vieille pierre.",
      hero_desc: "Alliant une connaissance approfondie du bâti local à une attitude conviviale pour gérer votre rénovation, du premier défi à la finition finale.",
      hero_btn_work: "Voir nos réalisations",
      hero_btn_ai: "Planifier avec notre outil IA",

      // AI Workshop
      ai_label: "Consultant Numérique",
      ai_title: "Visualisez votre projet avant de commencer.",
      ai_desc: "Rénover en France implique des règles spécifiques. Décrivez votre idée, et notre outil IA générera une feuille de route professionnelle pour vous aider à comprendre l'ampleur des travaux.",
      ai_point_1: "Recevez un plan en 5 étapes",
      ai_point_2: "Comprendre la terminologie",
      ai_point_3: "Conseils préliminaires gratuits",
      ai_input_label: "Décrivez votre idée de projet",
      ai_placeholder: "ex : Je veux transformer une vieille grange près de Ribérac en gîte de 3 chambres...",
      ai_btn_generate: "Générer la feuille de route",
      ai_btn_loading: "Analyse en cours...",
      ai_output_title: "Feuille de route recommandée",

      // Services
      serv_eyebrow: "Notre Expertise",
      serv_title: "Vingt ans d'expérience locale appliqués à chaque détail",
      serv_1_title: "Rénovation Totale",
      serv_1_desc: "Nous gérons votre projet du début à la fin, en utilisant notre expertise locale pour naviguer dans les réglementations et restaurer votre propriété.",
      serv_2_title: "Cuisines & Salles de bains",
      serv_2_desc: "Nous concevons et installons des cuisines et salles de bains fiables et performantes, aussi fonctionnelles qu'esthétiques.",
      serv_3_title: "Structure & Maçonnerie",
      serv_3_desc: "Travaux structurels et réparations de maçonnerie traités avec la précision que les bâtiments locaux exigent.",

      // Portfolio
      port_title: "Projets Récents",
      port_link: "Voir Instagram",
      
      proj_1_title: "Conversion de Grange",
      proj_1_type: "Rénovation Complète",
      proj_2_title: "Cuisine de Ferme",
      proj_2_type: "Intérieur",
      proj_3_title: "Pool House",
      proj_3_type: "Extension",
      proj_4_title: "Maison de Ville",
      proj_4_type: "Restauration",
      
      // Contact
      cont_title: "Prêt à discuter de votre projet ?",
      cont_desc: "Qu'il s'agisse d'une petite réparation ou d'une conversion complète, contactez Evans Rénovation dès aujourd'hui.",
      cont_call: "Appelez-nous",
      cont_email: "Envoyez-nous un email",
      form_name: "Nom",
      form_phone: "Téléphone",
      form_email: "Adresse Email",
      form_msg: "Parlez-nous de votre projet...",
      form_btn: "Envoyer le message"
    }
  };

  const t = translations[language]; // 't' is now our shortcut to the current language
  
// --- NEW: Add this function here ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // 1. Go to https://formspree.io, create a free form, and get your unique ID
    // 2. Replace "YOUR_ID_HERE" with that ID (e.g., "xkdqvng")
    const formEndpoint = "https://formspree.io/f/xaqqjray";

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        alert("Message sent successfully!");
        e.target.reset(); // Clears the form inputs
      } else {
        alert("Oops! There was a problem sending your form.");
      }
    } catch (error) {
      alert("Error sending message. Please try again later.");
    }
  };
  // --- Data & Content ---
  const services = [
    { 
      title: t.serv_1_title, 
      desc: t.serv_1_desc, 
      icon: <Hammer className="w-6 h-6 text-evans-amber" /> 
    },
    { 
      title: t.serv_2_title, 
      desc: t.serv_2_desc, 
      icon: <Paintbrush className="w-6 h-6 text-evans-amber" /> 
    },
    { 
      title: t.serv_3_title, 
      desc: t.serv_3_desc, 
      icon: <Ruler className="w-6 h-6 text-evans-amber" /> 
    }
  ];

  const projects = [
    { 
      id: 1, 
      title: t.proj_1_title, 
      loc: "Verteillac", 
      type: t.proj_1_type 
    },
    { 
      id: 2, 
      title: t.proj_2_title, 
      loc: "Aubeterre", 
      type: t.proj_2_type 
    },
    { 
      id: 3, 
      title: t.proj_3_title, 
      loc: "Ribérac", 
      type: t.proj_3_type 
    },
    { 
      id: 4, 
      title: t.proj_4_title, 
      loc: "Angoulême", 
      type: t.proj_4_type 
    },
  ];

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-[60] flex flex-col items-center justify-center space-y-8 backdrop-blur-sm animate-in fade-in duration-200">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full">
            <X size={32} />
          </button>
          {/* New Mobile Menu with Translations */}
<div className="flex flex-col items-center space-y-8">
  <a href="#services" onClick={() => setIsMenuOpen(false)} className="text-2xl text-white font-serif font-light tracking-wide hover:text-evans-amber transition-colors">
    {t.nav_services}
  </a>
  
  <a href="#workshop" onClick={() => setIsMenuOpen(false)} className="text-2xl text-white font-serif font-light tracking-wide hover:text-evans-amber transition-colors">
    {t.nav_workshop}
  </a>

  <a href="#portfolio" onClick={() => setIsMenuOpen(false)} className="text-2xl text-white font-serif font-light tracking-wide hover:text-evans-amber transition-colors">
    {t.nav_portfolio}
  </a>

  <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-2xl text-white font-serif font-light tracking-wide hover:text-evans-amber transition-colors">
    {t.nav_contact}
  </a>

  <button 
  onClick={() => { setIsPortalOpen(true); setIsMenuOpen(false); }} 
  className="text-2xl text-white font-serif font-light tracking-wide hover:text-evans-amber transition-colors"
>
  Client Login
</button>
</div>
          {/* NEW: Mobile Language Toggle */}
<button 
  onClick={() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
    setIsMenuOpen(false); // Optional: closes menu when you switch
  }}
  className="mt-8 px-6 py-2 border border-white/30 rounded-full text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
>
  {/* Shows target language: "PASSER EN FRANÇAIS" or "SWITCH TO ENGLISH" */}
  {language === 'en' ? 'Passer en Français' : 'Switch to English'}
</button>
          
        </div>
      )}

      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            
   <img 
     src="/EVANS_LOGO.png" 
     alt="Evans Rénovation" 
     className={`h-16 w-auto object-contain transition-all duration-300 ${scrolled ? '' : 'invert brightness-0'}`} 
   />
</div>
          
          {/* Desktop Links */}
<div className={`hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest ${scrolled ? 'text-slate-600' : 'text-slate-200'}`}>
  
  {/* 1. Services */}
  <a href="#services" className="hover:text-evans-amber transition-colors">
    {t.nav_services}
  </a>

  {/* 2. AI Workshop */}
  <a href="#workshop" className="flex items-center gap-2 hover:text-evans-amber transition-colors whitespace-nowrap">
    {t.nav_workshop} <Sparkles size={14} className="text-evans-amber" />
  </a>

  {/* 3. Portfolio */}
  <a href="#portfolio" className="hover:text-evans-amber transition-colors">
    {t.nav_portfolio}
  </a>

  {/* 4. Contact */}
  <a href="#contact" className={`px-6 py-3 rounded-md transition-all ${scrolled ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
    {t.nav_contact}
  </a>

<button 
  onClick={() => setIsPortalOpen(true)}
  className={`ml-4 px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/20 ${scrolled ? 'text-slate-900' : 'text-white'}`}
>
  Login
</button>
  
  {/* Language Toggle */}
  <button 
    onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
    className={`
      ml-4 px-3 py-1 rounded border-2 font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:opacity-75
      ${scrolled ? 'border-slate-900 text-slate-900' : 'border-slate-900 text-slate-900 invert brightness-0'}
    `}
  >
    {language === 'en' ? 'FR' : 'EN'}
  </button>
</div>

          {/* Mobile Toggle */}
          <button className={`md:hidden p-2 ${scrolled ? 'text-slate-900' : 'text-white'}`} onClick={() => setIsMenuOpen(true)}>
            <Menu />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center bg-slate-900 overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-900/60 z-10" />
          <div 
            className="w-full h-full bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-50 scale-105 animate-in fade-in duration-1000"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mt-16">
  {/* Badge */}
  <div className="inline-block px-4 py-1 mb-6 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4 duration-700">
    {t.hero_badge}
  </div>
  
  {/* Main Headline */}
  <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-8 tracking-tight leading-[1.1] animate-in slide-in-from-bottom-8 duration-700 delay-100">
    {t.hero_title_1} <br/>
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 italic pr-2">
      {t.hero_title_2}
    </span>
    {t.hero_title_3}
  </h1>
  
  {/* Description Paragraph */}
  <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl mx-auto font-light leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
    {t.hero_desc}
  </p>
  
  {/* Buttons */}
  <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-8 duration-700 delay-300">
    <a href="#portfolio" className="bg-evans-amber text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-amber-400 transition-all flex items-center justify-center group">
      {t.hero_btn_work}
      <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </a>
    <a href="#workshop" className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-bold border border-white/10 hover:bg-white/20 transition-all">
      {t.hero_btn_ai}
    </a>
  </div>
</div>
      </header>

      {/* Services Grid */}
      <section id="services" className="py-24 px-6 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">{t.serv_eyebrow}</h2>
            <h3 className="text-3xl md:text-4xl font-serif text-slate-900">{t.serv_title}</h3>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <div key={i} className="group p-8 bg-white rounded-2xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                  {s.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h4>
                <p className="text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* AI Workshop Section */}
      <section id="workshop" className="py-24 px-6 bg-white border-b border-slate-100 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Left Col: Explainer */}
            <div className="flex-1 md:sticky md:top-32">
  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest mb-4">
    <Sparkles size={16} /> {t.ai_label}
  </div>
  <h2 className="text-4xl font-serif text-slate-900 mb-6">{t.ai_title}</h2>
  <p className="text-slate-500 leading-relaxed mb-8">
    {t.ai_desc}
  </p>
  <div className="flex flex-col gap-4 text-sm text-slate-600">
    <div className="flex items-center gap-3">
      <CheckCircle2 size={18} className="text-green-500" />
      <span>{t.ai_point_1}</span>
    </div>
    <div className="flex items-center gap-3">
      <CheckCircle2 size={18} className="text-green-500" />
      <span>{t.ai_point_2}</span>
    </div>
    <div className="flex items-center gap-3">
      <CheckCircle2 size={18} className="text-green-500" />
      <span>{t.ai_point_3}</span>
    </div>
  </div>
</div>

            {/* Right Col: The Tool */}
            <div className="flex-1 w-full bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
             <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.ai_input_label}</label>
<textarea 
  value={projectInput}
  onChange={(e) => setProjectInput(e.target.value)}
  placeholder={t.ai_placeholder}
  className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 mb-4 bg-white resize-none"
/>
<button 
  onClick={handleGenerateRoadmap}
  disabled={isAiLoading || !projectInput}
  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isAiLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
  <span>{isAiLoading ? t.ai_btn_loading : t.ai_btn_generate}</span>
</button>

              {/* Output Area */}
              {aiError && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {aiError}
                </div>
              )}

              {aiOutput && (
                <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest mb-3">
                    <Construction size={14} /> Recommended Roadmap
                  </div>
                  <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                    {aiOutput}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      

      {/* Portfolio Grid */}
      <section id="portfolio" className="py-24 px-6 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <h2 className="text-3xl font-serif text-slate-900">{t.port_title}</h2>
            <a href="#" className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-amber-600 border-b-2 border-transparent hover:border-amber-600 transition-all pb-1">
              {t.port_link}
            </a>
          </div>
          
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-200 cursor-pointer">
                {/* Image Logic */}
                <div className="absolute inset-0 bg-slate-300 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="inline-block px-2 py-1 mb-2 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-md border border-amber-500/30">
                    {p.type}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-1">{p.title}</h3>
                  <p className="text-sm text-slate-300 flex items-center gap-1">
                    <MapPin size={12} /> {p.loc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Footer */}
<section id="contact" className="bg-slate-900 text-white py-24 px-6">
  {/* 1. The Big Header */}
  <div className="max-w-4xl mx-auto text-center mb-16">
    <h2 className="text-4xl md:text-5xl font-serif mb-6">{t.cont_title}</h2>
    <p className="text-slate-400 text-lg max-w-xl mx-auto">
      {t.cont_desc}
    </p>
  </div>

  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    {/* 2. Contact Info (Phone & Email) */}
    <div className="space-y-8 md:pl-12">
      {/* Phone Block */}
      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
        <Phone className="text-evans-amber shrink-0" />
        <div>
          <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">{t.cont_call}</div>
          <div className="text-2xl font-serif">+33 (0)6 52 93 97 52</div>
        </div>
      </div>
      
      {/* Email Block */}
      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
        <Mail className="text-evans-amber shrink-0" />
        <div>
          <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">{t.cont_email}</div>
          <div className="text-2xl font-serif">cameron@evansrenovation.fr bradley@evansrenovation.fr</div>
        </div>
      </div>
    </div>

          {/* Simple Form */}
         <form 
  className="bg-white p-8 rounded-2xl text-slate-900 shadow-xl" 
  onSubmit={handleFormSubmit}
>
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {/* Name Input */}
      <input 
        type="text" 
        name="name" 
        required
        placeholder={t.form_name} 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
      />
      
      {/* Phone Input */}
      <input 
        type="text" 
        name="phone"
        placeholder={t.form_phone} 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
      />
    </div>

    {/* Email Input */}
    <input 
      type="email" 
      name="email" 
      required
      placeholder={t.form_email} 
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
    />

    {/* Message Input */}
    <textarea 
      name="message" 
      required 
      rows="4"
      placeholder={t.form_msg} 
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
    ></textarea>
    
    {/* Submit Button */}
    <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all shadow-lg">
      {t.form_btn}
    </button>
  </div>
</form>
        </div>

        <div className="border-t border-white/10 mt-24 pt-8 text-center text-slate-500 text-sm flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
          </div>
          <p>&copy; {new Date().getFullYear()} Evans Rénovation. All rights reserved.</p>
        </div>
      </section>
      <ClientPortal 
        isOpen={isPortalOpen} 
        onClose={() => setIsPortalOpen(false)} 
        initialLang={language}
        />
    </div>
  );
}





































