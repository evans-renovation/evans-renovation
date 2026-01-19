import React, { useState, useEffect } from 'react';
import { 
  Hammer, Paintbrush, Ruler, Phone, Mail, MapPin, 
  ChevronRight, Menu, X, Facebook, Instagram, 
  Sparkles, Send, Loader2, Construction, CheckCircle2
} from 'lucide-react';

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
  
  // --- AI Feature State ---
  const [projectInput, setProjectInput] = useState('');
  const [aiOutput, setAiOutput] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // IMPORTANT: For local use, paste your API key inside the quotes below.
  // Get one here: https://aistudio.google.com/app/apikey
  const apiKey = ""; 

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

    const systemPrompt = "You are a senior renovation consultant for 'Evans Rénovation' in France. Create a 5-step renovation roadmap for the client's request. Focus on: 1. Initial survey/permissions (Mairie), 2. Structural integrity, 3. Systems (electric/plumbing), 4. Insulation/Drywall, 5. Finishes. Keep it professional, encouraging, and mention French specificities (e.g., Norme NF C 15-100) if relevant.";
    
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

  // --- Data & Content ---
  const services = [
    { 
      title: "Total Renovation", 
      desc: "From ruin to residence. We handle full-scale restorations of Charentaise stone properties.", 
      icon: <Hammer className="w-6 h-6 text-evans-amber" /> 
    },
    { 
      title: "Kitchens & Baths", 
      desc: "Modern English plumbing standards meets classic French aesthetics.", 
      icon: <Paintbrush className="w-6 h-6 text-evans-amber" /> 
    },
    { 
      title: "Structural & Masonry", 
      desc: "Opening walls, repairing stonework, and ensuring structural longevity.", 
      icon: <Ruler className="w-6 h-6 text-evans-amber" /> 
    }
  ];

  const projects = [
    { id: 1, title: "Barn Conversion", loc: "Verteillac", type: "Full Build" },
    { id: 2, title: "Farmhouse Kitchen", loc: "Aubeterre", type: "Interior" },
    { id: 3, title: "Pool House", loc: "Ribérac", type: "Extension" },
    { id: 4, title: "Townhouse Reno", loc: "Angoulême", type: "Restoration" },
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
          {['Portfolio', 'Services', 'Workshop', 'Contact'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase()}`} 
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl text-white font-serif font-light tracking-wide hover:text-evans-amber transition-colors"
            >
              {item}
            </a>
          ))}
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
            <a href="#portfolio" className="hover:text-evans-amber transition-colors">Portfolio</a>
            <a href="#services" className="hover:text-evans-amber transition-colors">Services</a>
            <a href="#workshop" className="flex items-center gap-2 hover:text-evans-amber transition-colors">
              AI Workshop <Sparkles size={14} className="text-evans-amber" />
            </a>
            <a href="#contact" className={`px-6 py-3 rounded-md transition-all ${scrolled ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
              Contact Us
            </a>
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
          <div className="inline-block px-4 py-1 mb-6 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4 duration-700">
            Based in Charente & Dordogne
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-8 tracking-tight leading-[1.1] animate-in slide-in-from-bottom-8 duration-700 delay-100">
            Breathing new <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 italic pr-2">Life</span>
            into old Stone.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl mx-auto font-light leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
            English craftsmanship meets French architectural heritage. We manage your renovation from the first stone to the final finish.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <a href="#portfolio" className="bg-evans-amber text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-amber-400 transition-all flex items-center justify-center group">
              View Our Work
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#workshop" className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-bold border border-white/10 hover:bg-white/20 transition-all">
              Plan with AI
            </a>
          </div>
        </div>
      </header>

      {/* AI Workshop Section */}
      <section id="workshop" className="py-24 px-6 bg-white border-b border-slate-100 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Left Col: Explainer */}
            <div className="flex-1 md:sticky md:top-32">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest mb-4">
                <Sparkles size={16} /> Digital Consultant
              </div>
              <h2 className="text-4xl font-serif text-slate-900 mb-6">Visualize your project before we break ground.</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Renovating in France involves specific regulations and stages. 
                Describe your rough idea here, and our AI tool will generate a structured, professional roadmap to help you understand the scope.
              </p>
              <div className="flex flex-col gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span>Receive a 5-step breakdown</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span>Understand French terminology</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span>Instant, free preliminary advice</span>
                </div>
              </div>
            </div>

            {/* Right Col: The Tool */}
            <div className="flex-1 w-full bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Describe your project idea</label>
              <textarea 
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                placeholder="e.g., I want to convert an old stone barn near Ribérac into a 3-bedroom gîte with a mezzanine..."
                className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 mb-4 bg-white resize-none"
              />
              
              <button 
                onClick={handleGenerateRoadmap}
                disabled={isAiLoading || !projectInput}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAiLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                <span>{isAiLoading ? 'Analyzing Request...' : 'Generate Roadmap'}</span>
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

      {/* Services Grid */}
      <section id="services" className="py-24 px-6 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Our Expertise</h2>
            <h3 className="text-3xl md:text-4xl font-serif text-slate-900">Quality craftsmanship for every stage of the build.</h3>
          </div>

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

      {/* Portfolio Grid */}
      <section id="portfolio" className="py-24 px-6 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <h2 className="text-3xl font-serif text-slate-900">Recent Projects</h2>
            <a href="#" className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-amber-600 border-b-2 border-transparent hover:border-amber-600 transition-all pb-1">
              View Instagram
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-200 cursor-pointer">
                {/* Placeholder Image Logic */}
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
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Ready to discuss your project?</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Whether it's a small repair or a full conversion, get in touch with the brothers today.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Contact Info */}
          <div className="space-y-8 md:pl-12">
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
              <Phone className="text-evans-amber shrink-0" />
              <div>
                <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Call Us</div>
                <div className="text-2xl font-serif">+33 (0)6 00 00 00 00</div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
              <Mail className="text-evans-amber shrink-0" />
              <div>
                <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Email Us</div>
                <div className="text-2xl font-serif">hello@evansreno.com</div>
              </div>
            </div>
          </div>

          {/* Simple Form */}
          <form className="bg-white p-8 rounded-2xl text-slate-900 shadow-xl" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                <input type="text" placeholder="Phone" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <input type="email" placeholder="Email Address" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              <textarea rows="4" placeholder="Tell us about your project..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"></textarea>
              <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all shadow-lg">
                Send Message
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
    </div>
  );
}





