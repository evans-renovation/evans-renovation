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

  const [selectedProject, setSelectedProject] = useState(null);
  
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
      nav_workshop: "Project Planner",
      nav_contact: "Contact Us",
      
      // Hero Section
     hero_badge: "Est. 2016 • Charente & Dordogne",
      hero_title_1: "Quality Renovations &",
      hero_title_2: "Expert Masonry.",
      hero_title_3: "", // We can leave this blank now
      hero_desc: "A family-run business built on clear communication, creative problem-solving, and quality workmanship. From traditional stone houses to new builds, we always find a way to deliver outstanding results.",
      hero_btn_work: "See Our Work",
      hero_btn_ai: "Discuss Your Project",

      // AI Workshop
      ai_label: "Interactive Tool",
      ai_title: "Visualize your project before we break ground.",
      ai_desc: "Renovating in France involves specific regulations and stages. Describe your rough idea here, and and we will generate a structured, professional roadmap to help you understand the scope.",
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
      serv_title: "Years of local building knowledge applied to every detail",
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
      nav_workshop: "Planificateur",
      nav_contact: "Contactez-nous",
      
      // Hero Section
      hero_badge: "Établi en 2016 • Charente & Dordogne",
      hero_title_1: "Rénovations de Qualité &",
      hero_title_2: "Maçonnerie Experte.", 
      hero_title_3: "",
      hero_desc: "Une entreprise familiale fondée sur une communication claire, la recherche de solutions et un savoir-faire exceptionnel. De la pierre traditionnelle aux constructions modernes, nous trouvons toujours le moyen d'offrir des résultats remarquables.",
      hero_btn_work: "Voir nos Projets",
      hero_btn_ai: "Discuter de votre projet",

      // AI Workshop
      ai_label: "Outil Interactif",
      ai_title: "Visualisez votre projet avant de commencer.",
      ai_desc: "Rénover en France implique des règles spécifiques. Décrivez votre idée, et nous générerons une feuille de route professionnelle pour vous aider à comprendre l'ampleur des travaux.",
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
      title: "Heritage Bathroom Refit", 
      loc: "Montboyer", 
      type: "Interior Refit",
      img: "/PXL_20231208_170400359.MP.jpg",
      beforeImg: "/PXL_20231110_155403522.MP.jpg",
      desc: "A full bathroom refit that balances modern luxury with heritage preservation. We integrated high-end fixtures and elegant gold trim while carefully maintaining and highlighting the beautiful, original rustic beams."
    },
    { 
      id: 2, 
      title: "Contemporary En-Suite", 
      loc: "Nanteuil-Auriac-de-Bourzac", 
      type: "Modern Interior",
      img: "/PXL_20240705_101036459.MP.jpg",
      beforeImg: "/PXL_20230821_073138080 (1).jpg",
      desc: "A complete bathroom overhaul featuring a sleek, modern aesthetic. We utilized a dark, sophisticated color palette, custom vanity units, and strategic lighting to create a premium, contemporary space."
    },
    { 
      id: 3, 
      title: "Travertine Terrace", 
      loc: "Juignac", 
      type: "Exterior Masonry",
      img: "/IMG_20210702_155510.jpg",
      // EXAMPLE OF A BEFORE PICTURE:
      beforeImg: "/IMG_20210330_120722.jpg", 
      desc: "We completely transformed an unusable gravel area into a pristine outdoor living space. The project involved pouring a solid concrete base and expertly tiling it with premium 60x40 travertine."
    },
    { 
      id: 4, 
      title: "Pool Terrace Extension", 
      loc: "Saint Antoine Cumond", 
      type: "Exterior Build",
      img: "/IMG_20220706_121637 (1).jpg",
      beforeImg: "/IMG_20220527_172415.jpg",
      desc: "A major exterior structural upgrade. We installed a full fibre-reinforced levelling screed and slab extension with perimeter drainage, finished seamlessly in travertine opus tiles and custom margelles."
    },
    { 
      id: 5, 
      title: "Lintel & Masonry Repair", 
      loc: "Orival", 
      type: "Restoration",
      img: "/PXL_20250730_133720074.jpg",
      beforeImg: "/IMG-20241011-WA0007.jpg",
      desc: "A precision like-for-like lintel replacement on a traditional stone property. The job included targeted masonry repairs and a full window replacement to ensure long-term structural integrity and weatherproofing."
    },
    { 
      id: 6, 
      title: "Stone Cladding & Exterior Refresh", 
      loc: "Aubeterre-sur-Dronne", 
      type: "Exterior Restoration",
      img: "/PXL_20260325_101608894.jpg", // PUT YOUR NEW AFTER PHOTO NAME HERE
      beforeImg: "/PXL_20260106_114854688.jpg", // PUT YOUR NEW BEFORE PHOTO NAME HERE
      desc: "Complete exterior preparation and installation of natural stone cladding (pierre de parement) with traditional pointing. The project also included the full preparation and painting of the adjacent exterior facade to bring the property back to life."
    }
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

 {/* 2. Project Planner */}
  <a href="#workshop" className="hover:text-evans-heritage transition-colors">
    {t.nav_workshop}
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
      <header className="relative h-screen flex items-center justify-center bg-evans-earth overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          {/* UPDATED OVERLAY: A gradient that gets darker where the text is */}
          <div className="absolute inset-0 bg-gradient-to-b from-evans-earth/30 via-evans-earth/60 to-evans-earth/90 z-10" />
          
          <div 
            className="w-full h-full bg-cover bg-center animate-in fade-in duration-1000"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mt-16">
          {/* Subtle Badge with text shadow */}
          <p className="text-evans-stone font-semibold tracking-[0.2em] uppercase text-sm mb-6 animate-in slide-in-from-bottom-4 duration-700 drop-shadow-md">
            {t.hero_badge}
          </p>
          
          {/* Main Headline - Added drop-shadow-lg so it pops off the background */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-8 tracking-tight leading-[1.2] animate-in slide-in-from-bottom-8 duration-700 delay-100 drop-shadow-lg">
            {t.hero_title_1} <br/>
            <span className="font-semibold text-evans-stone">
              {t.hero_title_2}
            </span>
          </h1>
          
          {/* Description Paragraph - Added text-shadow */}
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200 drop-shadow-md">
            {t.hero_desc}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <a href="#portfolio" className="bg-evans-heritage text-white px-8 py-4 rounded font-semibold hover:bg-[#586751] transition-all flex items-center justify-center group shadow-lg">
              {t.hero_btn_work}
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#contact" className="bg-evans-earth/50 backdrop-blur-sm text-white px-8 py-4 rounded font-semibold border border-white/30 hover:bg-evans-earth/80 transition-all shadow-lg">
              {t.hero_btn_ai}
            </a>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <section id="services" className="py-24 px-6 bg-evans-stone scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            {/* Changed from amber-600 to your new sage green */}
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-evans-heritage mb-3">{t.serv_eyebrow}</h2>
            {/* Changed from slate-900 to your new rich earthy brown */}
            <h3 className="text-3xl md:text-4xl font-serif text-evans-earth">{t.serv_title}</h3>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <div key={i} className="group p-8 bg-white rounded shadow-sm border border-black/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-evans-stone rounded flex items-center justify-center mb-6 transition-colors">
                  {/* The icon itself should also use the sage green or earthy brown */}
                  <span className="text-evans-heritage">{s.icon}</span>
                </div>
                <h4 className="text-xl font-bold text-evans-earth mb-3">{s.title}</h4>
                <p className="text-black/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* AI Workshop Section */}
      <section id="workshop" className="py-24 px-6 bg-white border-b border-black/5 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Left Col: Explainer */}
            <div className="flex-1 md:sticky md:top-32">
              {/* Removed the Sparkles icon and changed amber to heritage green */}
              <div className="flex items-center gap-2 text-evans-heritage font-semibold text-xs uppercase tracking-widest mb-4">
                {t.ai_label}
              </div>
              <h2 className="text-4xl font-serif text-evans-earth mb-6">{t.ai_title}</h2>
              <p className="text-black/60 leading-relaxed mb-8">
                {t.ai_desc}
              </p>
              <div className="flex flex-col gap-4 text-sm text-evans-earth/80 font-medium">
                {/* Changed the green checkmarks to heritage green */}
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-evans-heritage" />
                  <span>{t.ai_point_1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-evans-heritage" />
                  <span>{t.ai_point_2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-evans-heritage" />
                  <span>{t.ai_point_3}</span>
                </div>
              </div>
            </div>

            {/* Right Col: The Tool */}
            <div className="flex-1 w-full bg-evans-stone p-6 md:p-8 rounded border border-black/5 shadow-sm">
             <label className="block text-xs font-semibold uppercase text-evans-earth/70 mb-2">{t.ai_input_label}</label>
              <textarea 
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                placeholder={t.ai_placeholder}
                className="w-full h-32 p-4 rounded bg-white border border-black/10 focus:ring-2 focus:ring-evans-heritage outline-none text-evans-earth mb-4 resize-none transition-all"
              />
              <button 
                onClick={handleGenerateRoadmap}
                disabled={isAiLoading || !projectInput}
                className="w-full bg-evans-heritage text-white py-4 rounded font-bold hover:bg-[#586751] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isAiLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                <span>{isAiLoading ? t.ai_btn_loading : t.ai_btn_generate}</span>
              </button>

              {/* Output Area */}
              {aiError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                  {aiError}
                </div>
              )}

              {aiOutput && (
                <div className="mt-6 pt-6 border-t border-black/10 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-evans-heritage font-semibold text-xs uppercase tracking-widest mb-3">
                    <Construction size={14} /> Recommended Roadmap
                  </div>
                  <div className="prose prose-sm max-w-none text-evans-earth/80 leading-relaxed whitespace-pre-line font-medium">
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
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-evans-heritage mb-3">Our Expertise</h2>
              <h3 className="text-3xl md:text-4xl font-serif text-evans-earth">Recent Projects</h3>
            </div>
            <a href="#" className="text-sm font-bold uppercase tracking-widest text-black/40 hover:text-evans-heritage border-b-2 border-transparent hover:border-evans-heritage transition-all pb-1">
              {t.port_link}
            </a>
          </div>
          
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedProject(p)}
                className="group relative aspect-[4/3] overflow-hidden rounded bg-evans-earth cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img src={p.img} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-evans-earth/90 via-evans-earth/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="inline-block px-2 py-1 mb-2 bg-evans-heritage/90 text-evans-stone text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-md border border-evans-heritage">
                    {p.type}
                  </span>
                  <h3 className="text-xl font-serif text-white mb-1">{p.title}</h3>
                  <p className="text-sm text-white/70 flex items-center gap-1 font-sans">
                    <MapPin size={14} /> {p.loc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROJECT MODAL OVERLAY --- */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Dark Background (Click to close) */}
          <div 
            className="absolute inset-0 bg-evans-earth/90 backdrop-blur-sm cursor-pointer transition-opacity"
            onClick={() => setSelectedProject(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-evans-stone w-full max-w-4xl rounded shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProject(null)} 
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-evans-earth rounded-full p-2 backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Image */}
            <div className="md:w-3/5 h-64 md:h-auto relative bg-evans-earth">
              <img src={selectedProject.img} alt={selectedProject.title} className="w-full h-full object-cover" />
            </div>

            {/* Modal Text */}
            <div className="md:w-2/5 p-8 flex flex-col justify-center bg-white">
              <span className="inline-block w-max px-2 py-1 mb-4 bg-evans-heritage/10 text-evans-heritage text-[10px] font-bold uppercase tracking-wider rounded border border-evans-heritage/20">
                {selectedProject.type}
              </span>
              <h3 className="text-3xl font-serif text-evans-earth mb-2">{selectedProject.title}</h3>
              <p className="text-sm text-black/50 mb-6 font-semibold flex items-center gap-1">
                <MapPin size={16} />
                {selectedProject.loc}
              </p>
              <p className="text-black/70 leading-relaxed">
                {selectedProject.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Footer */}
      <section id="contact" className="bg-evans-earth text-white py-24 px-6">
        {/* 1. The Big Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">{t.cont_title}</h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            {t.cont_desc}
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* 2. Contact Info (Phone & Email) */}
          <div className="space-y-8 md:pl-12">
            {/* Phone Block */}
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
              <Phone className="text-evans-heritage shrink-0" />
              <div>
                <div className="text-sm text-white/50 uppercase tracking-widest font-bold">{t.cont_call}</div>
                <div className="text-2xl font-serif">+33 (0)6 52 93 97 52</div>
              </div>
            </div>
            
            {/* Email Block */}
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
              <Mail className="text-evans-heritage shrink-0" />
              <div>
                <div className="text-sm text-white/50 uppercase tracking-widest font-bold">{t.cont_email}</div>
                <div className="text-2xl font-serif">info@evansrenovation.fr</div>
              </div>
            </div>
          </div>

          {/* Simple Form */}
          <form 
            className="bg-white p-8 rounded text-evans-earth shadow-xl" 
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
                  className="w-full p-3 bg-evans-stone border border-black/10 rounded focus:ring-2 focus:ring-evans-heritage outline-none transition-all" 
                />
                
                {/* Phone Input */}
                <input 
                  type="text" 
                  name="phone"
                  placeholder={t.form_phone} 
                  className="w-full p-3 bg-evans-stone border border-black/10 rounded focus:ring-2 focus:ring-evans-heritage outline-none transition-all" 
                />
              </div>

              {/* Email Input */}
              <input 
                type="email" 
                name="email" 
                required
                placeholder={t.form_email} 
                className="w-full p-3 bg-evans-stone border border-black/10 rounded focus:ring-2 focus:ring-evans-heritage outline-none transition-all" 
              />

              {/* Message Input */}
              <textarea 
                name="message" 
                required 
                rows="4"
                placeholder={t.form_msg} 
                className="w-full p-3 bg-evans-stone border border-black/10 rounded focus:ring-2 focus:ring-evans-heritage outline-none transition-all resize-none"
              ></textarea>
              
              {/* Submit Button */}
              <button className="w-full py-4 bg-evans-heritage text-white font-bold rounded hover:bg-[#586751] transition-all shadow-md">
                {t.form_btn}
              </button>
            </div>
          </form>
        </div>

        <div className="border-t border-white/10 mt-24 pt-8 text-center text-white/50 text-sm flex flex-col items-center gap-4">
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










































