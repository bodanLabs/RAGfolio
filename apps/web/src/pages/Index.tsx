import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  MessageSquare, 
  Zap, 
  Shield, 
  FileText, 
  Brain, 
  Search, 
  LayoutGrid, 
  Terminal,
  CheckCircle2,
  Sparkles,
  Cpu,
  BarChart3,
  Globe,
  Lock,
  Play
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// --- Utility Components & Hooks ---

const useIntersectionObserver = (options = {}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  return [elementRef, isVisible] as const;
};

const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [ref, isVisible] = useIntersectionObserver();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const BentoCard = ({ 
  children, 
  className = "", 
  title, 
  description, 
  icon: Icon,
  colSpan = 1 
}: { 
  children?: React.ReactNode; 
  className?: string;
  title: string;
  description: string;
  icon: any;
  colSpan?: 1 | 2 | 3;
}) => {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 p-8 transition-all hover:bg-slate-900/50",
      colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
      colSpan === 3 ? "md:col-span-3" : "",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A24D]/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/80 border border-white/5 shadow-inner">
          <Icon className="h-6 w-6 text-[#C9A24D]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-100 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow">{description}</p>
        {children}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-[#C9A24D] selection:text-slate-950 overflow-x-hidden font-sans">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#C9A24D]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#C9A24D] to-[#E5C678] shadow-lg shadow-[#C9A24D]/20 transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-slate-950 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">RAGfolio</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Solutions', 'Pricing', 'Docs'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-200 rounded-full px-6 transition-all duration-300">
              <Link to="/signup">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24">
        
        {/* Hero Section */}
        <section className="relative px-6 mb-32 pt-16">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl mb-8 hover:bg-white/10 transition-colors cursor-pointer">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A24D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A24D]"></span>
                </span>
                <span className="text-sm font-medium text-slate-200">Introducing RAGfolio Enterprise</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-1" />
              </div>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
                Chat with your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A24D] via-[#F2D68C] to-[#C9A24D] animate-gradient">
                  Knowledge Base
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                Transform your static documents into an intelligent, conversational AI presence. 
                Instant answers, deep insights, and seamless integration for your entire team.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <Button asChild size="lg" className="h-14 px-8 rounded-full text-base bg-[#C9A24D] text-slate-950 hover:bg-[#b38f3f] shadow-[0_0_40px_rgba(201,162,77,0.3)] hover:shadow-[0_0_60px_rgba(201,162,77,0.5)] transition-all duration-300">
                  <Link to="/signup">
                    Start Building for Free <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full text-base border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  <Link to="/login">
                    View Interactive Demo
                  </Link>
                </Button>
              </div>
            </FadeIn>

            {/* Dashboard Preview - Interactive Link */}
            <FadeIn delay={500}>
               <Link to="/signup">
                  <div className="relative mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] group cursor-pointer transition-transform duration-500 hover:scale-[1.01] hover:border-[#C9A24D]/30">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#C9A24D]/5 to-transparent opacity-50 pointer-events-none" />
                    
                    {/* Mock UI Header */}
                    <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                      </div>
                      <div className="ml-4 h-6 w-96 rounded-md bg-white/5" />
                    </div>

                    <div className="p-8 grid grid-cols-12 gap-6 h-full">
                       {/* Sidebar */}
                       <div className="col-span-3 space-y-4">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-10 w-full rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                          ))}
                          <div className="h-px bg-white/5 my-4" />
                          {[1,2,3,4].map(i => (
                            <div key={i} className="h-6 w-3/4 rounded bg-white/5 opacity-50" />
                          ))}
                       </div>

                       {/* Main Chat Area */}
                       <div className="col-span-9 flex flex-col gap-6">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-1/4 rounded bg-slate-800" />
                              <div className="h-20 w-3/4 rounded-xl bg-slate-800/50" />
                            </div>
                          </div>
                          
                          <div className="flex flex-row-reverse gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#C9A24D] flex-shrink-0" />
                            <div className="space-y-2 flex-1 flex flex-col items-end">
                              <div className="h-4 w-1/4 rounded bg-[#C9A24D]/20 self-end" />
                              <div className="h-32 w-full max-w-xl rounded-xl bg-[#C9A24D]/10 border border-[#C9A24D]/20 p-4">
                                 <div className="space-y-2">
                                    <div className="h-2 w-full bg-[#C9A24D]/20 rounded" />
                                    <div className="h-2 w-full bg-[#C9A24D]/20 rounded" />
                                    <div className="h-2 w-2/3 bg-[#C9A24D]/20 rounded" />
                                 </div>
                                 <div className="mt-4 flex gap-2">
                                    <div className="h-20 w-32 rounded bg-black/20" />
                                    <div className="h-20 w-32 rounded bg-black/20" />
                                 </div>
                              </div>
                            </div>
                          </div>
                       </div>
                    </div>

                    {/* Overlay Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-full font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <Play className="w-5 h-5 fill-current" />
                        Try Live Demo
                      </div>
                    </div>
                  </div>
               </Link>
            </FadeIn>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="px-6 py-32 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                  Unleash the Power of Context
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                  Everything you need to ingest, process, and query your proprietary data with state-of-the-art LLMs.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <BentoCard 
                title="Hybrid Search Engine" 
                icon={Search} 
                description="Combining vector embeddings with keyword search for pinpoint accuracy."
                colSpan={2}
                className="bg-slate-900/40"
              >
                <div className="mt-6 flex gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-slate-950 border border-white/5 text-xs font-mono text-slate-500">
                    Query: "Q3 revenue growth"
                  </div>
                  <div className="flex items-center text-[#C9A24D]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-[#C9A24D]/10 border border-[#C9A24D]/20 text-xs font-mono text-[#C9A24D]">
                    Match: 98.4% relevance
                  </div>
                </div>
              </BentoCard>

              <BentoCard 
                title="Secure by Design" 
                icon={Lock} 
                description="Enterprise-grade encryption for all your sensitive documents."
              >
                 <div className="mt-4 flex justify-center">
                    <Shield className="w-24 h-24 text-green-500/20" />
                 </div>
              </BentoCard>

              <BentoCard 
                title="Real-time Processing" 
                icon={Zap} 
                description="Upload diverse formats (PDF, DOCX) and start chatting in seconds."
              >
                 <div className="mt-4 space-y-2">
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-[#C9A24D] w-full animate-[shimmer_2s_infinite]" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                       <span>Processed</span>
                       <span className="text-[#C9A24D]">100%</span>
                    </div>
                 </div>
              </BentoCard>

              <BentoCard 
                title="Model Agnostic" 
                icon={Cpu} 
                description="Bring your own API keys. Supports OpenAI, Anthropic, Gemini, and local LLMs."
                colSpan={2}
              >
                <div className="mt-6 flex gap-4 md:gap-8 justify-center items-center">
                   {['OpenAI', 'Anthropic', 'Gemini', 'Meta'].map((model) => (
                      <div key={model} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-default">
                         {model}
                      </div>
                   ))}
                </div>
              </BentoCard>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="px-6 py-24 border-y border-white/5 bg-slate-900/20">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                 <h2 className="text-3xl font-bold text-white">Deep Usage Analytics</h2>
                 <p className="text-slate-400 text-lg leading-relaxed">
                    Track user engagement, popular queries, and token usage. Optimize your knowledge base driven by real data, not guesswork.
                 </p>
                 <ul className="space-y-4">
                    {['Query latency tracking', 'Token cost analysis', 'User session playback'].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-300">
                         <CheckCircle2 className="w-5 h-5 text-[#C9A24D]" />
                         {item}
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="flex-1 relative">
                 <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                 <div className="relative rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                    <BarChart3 className="w-full h-64 text-slate-700" />
                    {/* Abstract Chart Overlay */}
                    <div className="absolute inset-0 flex items-end justify-around px-10 pb-10 pt-20 gap-4">
                       {[30, 50, 40, 70, 50, 80, 60].map((h, i) => (
                          <div key={i} className="w-full bg-[#C9A24D]" style={{ height: `${h}%`, opacity: 0.1 + (i * 0.1) }} />
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-32 relative overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
              Ready to modernize your docs?
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Join the future of knowledge management. Open source, secure, and designed for builders.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button asChild size="lg" className="h-16 px-10 text-lg rounded-full bg-white text-slate-950 hover:bg-slate-200">
                <Link to="/signup">
                  Get Started Now
                </Link>
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-slate-500">
              No credit card required for free tier. Open source and self-hostable.
            </p>
          </div>

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A24D]/10 blur-[150px] rounded-full -z-10" />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded bg-[#C9A24D] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-slate-200">RAGfolio</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Advanced RAG platform for your proprietary data. Built with precision and performance in mind.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-[#C9A24D]">Features</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Integrations</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Pricing</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-[#C9A24D]">Documentation</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">API Reference</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Community</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-[#C9A24D]">Privacy</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Terms</a></li>
              <li><a href="#" className="hover:text-[#C9A24D]">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2026 RAGfolio Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors"><Globe className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition-colors"><MessageSquare className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition-colors"><Terminal className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;