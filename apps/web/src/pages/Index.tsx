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
  Cpu
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// --- Utility Hooks & Components ---

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

const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 text-slate-200 shadow-2xl transition-colors hover:border-slate-700",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(201, 162, 77, 0.1), transparent 40%)`,
        }}
      />
      <div className="relative h-full p-6">{children}</div>
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-[#C9A24D] selection:text-slate-950 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#C9A24D] opacity-[0.03] blur-[100px]" />
        <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-900 opacity-[0.05] blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#C9A24D] flex items-center justify-center shadow-[0_0_15px_rgba(201,162,77,0.3)] transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">RAGfolio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-[#C9A24D] text-slate-950 hover:bg-[#b38f3f] hover:shadow-[0_0_20px_rgba(201,162,77,0.3)] transition-all duration-300">
              <Link to="/signup">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative px-6 mb-32">
          <div className="max-w-5xl mx-auto text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A24D]/20 bg-[#C9A24D]/5 text-[#C9A24D] text-xs font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A24D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A24D]"></span>
                </span>
                RAGfolio 2.0 is now available
              </div>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-50 to-slate-400">
                Chat with your <br />
                <span className="text-[#C9A24D]">Knowledge Base</span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Transform your static documents into an intelligent, conversational AI. 
                Upload PDFs, DOCX, and TXT files to instantly extract insights and get answers.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-8 text-base bg-[#C9A24D] text-slate-950 hover:bg-[#b38f3f] hover:shadow-[0_0_30px_rgba(201,162,77,0.4)] transition-all duration-300">
                  <Link to="/signup">
                    Start Building Free <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  <Link to="/login">
                    Live Demo
                  </Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Visual Demo Section */}
        <section className="px-6 mb-32">
          <FadeIn delay={400}>
            <div className="max-w-5xl mx-auto rounded-xl border border-slate-800 bg-slate-950/50 shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="flex-1 text-center text-xs text-slate-500 font-mono">ragfolio-preview.tsx</div>
              </div>
              <div className="p-6 md:p-12 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-24 bg-slate-800 rounded" />
                      <div className="h-2 w-full bg-slate-800/50 rounded" />
                      <div className="h-2 w-3/4 bg-slate-800/50 rounded" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-20 bg-slate-800 rounded" />
                      <div className="h-2 w-full bg-slate-800/50 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <ArrowRight className="w-6 h-6 text-slate-700 rotate-90 md:rotate-0" />
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#C9A24D]/10 blur-2xl rounded-full" />
                  <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-[#C9A24D] text-slate-950 px-4 py-2 rounded-2xl rounded-br-sm text-sm font-medium">
                        Summarize the Q3 financial report.
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
                        <p className="mb-2">Based on the Q3 report, here are the key highlights:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                          <li>Revenue increased by 15% YoY</li>
                          <li>Operating costs reduced by 8%</li>
                          <li>New market expansion in APAC region</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-24 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">Everything you need to build</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Powerful features designed for developers and businesses who need reliable, secure, and fast document intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SpotlightCard>
                <div className="w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-[#C9A24D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">Advanced RAG Engine</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Our retrieval engine uses hybrid search to ensure the most relevant context is always found for your queries.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                  <Terminal className="w-6 h-6 text-[#C9A24D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">Developer API</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Integrate RAGfolio directly into your applications with our robust and well-documented REST API.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#C9A24D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">Enterprise Security</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your data is encrypted at rest and in transit. Role-based access control ensures data privacy.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                  <LayoutGrid className="w-6 h-6 text-[#C9A24D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">Organization Management</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Create organizations, invite team members, and manage permissions with a centralized dashboard.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-[#C9A24D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">Model Agnostic</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Bring your own LLM keys. Support for OpenAI, Anthropic, and other major providers.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-[#C9A24D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">Deep Insights</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Go beyond simple chat. Extract structured data, summaries, and sentiment from your document corpus.
                </p>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute inset-0 bg-[#C9A24D]/20 blur-[100px] -z-10" />
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-8 md:p-16 text-center overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A24D] to-transparent opacity-50" />
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-100">Ready to transform your workflow?</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Join thousands of users who are already using RAGfolio to make their documents interactive and useful.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto bg-[#C9A24D] text-slate-950 hover:bg-[#b38f3f]">
                  <Link to="/signup">
                    Get Started Now
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A24D]" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#C9A24D] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-slate-950" />
            </div>
            <span className="text-lg font-bold text-slate-200">RAGfolio</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2026 RAGfolio Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-[#C9A24D] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#C9A24D] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#C9A24D] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#C9A24D] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;