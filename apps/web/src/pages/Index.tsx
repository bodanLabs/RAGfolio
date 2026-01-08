import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const lastMousePosition = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      // Update mouse position to center on resize
      lastMousePosition.current = {
        x: canvas.width / 2,
        y: canvas.height / 2
      };
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create particles spreading from mouse position
      const angleStep = (Math.PI * 2) / 12; // 12 particles in a circle
      for (let i = 0; i < 12; i++) {
        const angle = angleStep * i;
        const speed = 2 + Math.random() * 3;
        const particle: Particle = {
          id: Date.now() + i,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60,
          maxLife: 60,
        };
        particlesRef.current.push(particle);
      }

      lastMousePosition.current = { x, y };

      // Limit particle count
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200);
      }
    };

    const animate = () => {
      ctx.fillStyle = '#0B1C2D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98; // Friction
        particle.vy *= 0.98;
        particle.life--;

        const alpha = particle.life / particle.maxLife;
        const size = 3 * alpha;

        // Draw particle with gold gradient
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, size * 2
        );
        gradient.addColorStop(0, `rgba(201, 162, 77, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(201, 162, 77, ${alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(201, 162, 77, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw trail
        ctx.strokeStyle = `rgba(201, 162, 77, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();

        return particle.life > 0;
      });

      // Draw mouse follower glow
      const glowGradient = ctx.createRadialGradient(
        lastMousePosition.current.x,
        lastMousePosition.current.y,
        0,
        lastMousePosition.current.x,
        lastMousePosition.current.y,
        100
      );
      glowGradient.addColorStop(0, 'rgba(201, 162, 77, 0.15)');
      glowGradient.addColorStop(0.5, 'rgba(201, 162, 77, 0.05)');
      glowGradient.addColorStop(1, 'rgba(201, 162, 77, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(
        lastMousePosition.current.x,
        lastMousePosition.current.y,
        100,
        0,
        Math.PI * 2
      );
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: '#0B1C2D' }}
    >
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ pointerEvents: 'none' }}
      />

      {/* Split Background with Gradient */}
      <div className="absolute inset-0 flex z-0">
        {/* Left Half - Darker Navy */}
        <div 
          className="relative w-1/2 h-full overflow-hidden"
          style={{ 
            backgroundColor: '#0B1C2D',
            backgroundImage: 'linear-gradient(135deg, #0B1C2D 0%, #132B44 100%)'
          }}
        >
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(230, 237, 245, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(230, 237, 245, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Right Half - Lighter Navy */}
        <div 
          className="relative w-1/2 h-full overflow-hidden"
          style={{ 
            backgroundColor: '#132B44',
            backgroundImage: 'linear-gradient(135deg, #132B44 0%, #0B1C2D 100%)'
          }}
        >
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(230, 237, 245, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(230, 237, 245, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      </div>

      {/* Divider Line */}
      <div 
        className="absolute top-0 bottom-0 left-1/2 w-px z-10"
        style={{ 
          background: 'linear-gradient(to bottom, transparent, #1E3A5A, transparent)',
          transform: 'translateX(-50%)'
        }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: '#C9A24D' }}
              />
              <div 
                className="absolute inset-0 w-10 h-10 rounded-full opacity-50 blur-md animate-pulse"
                style={{ backgroundColor: '#C9A24D' }}
              />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#E6EDF5' }}>RAGfolio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="hover:bg-[#132B44]/50 transition-colors"
              style={{ color: '#E6EDF5' }}
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button 
              className="shadow-lg hover:opacity-90 transition-opacity"
              style={{ 
                backgroundColor: '#C9A24D',
                color: '#0B1C2D'
              }}
              asChild
            >
              <Link to="/signup">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative max-w-6xl px-6 text-center">
          {/* Title */}
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            style={{ 
              color: '#E6EDF5',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            Your Intelligent
            <br />
            <span style={{ color: '#C9A24D' }}>
              Document Companion
            </span>
          </h1>

          {/* Description */}
          <p 
            className="max-w-2xl mx-auto text-xl md:text-2xl mb-12"
            style={{ color: '#9FB2C8' }}
          >
            RAGfolio is a cutting-edge RAG application that allows you to chat with your documents, 
            extract key insights, and streamline your workflow.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform"
              style={{ 
                backgroundColor: '#C9A24D',
                color: '#0B1C2D'
              }}
              asChild
            >
              <Link to="/signup">
                Get Started for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 backdrop-blur-sm hover:scale-105 transition-transform"
              style={{ 
                borderColor: '#1E3A5A',
                color: '#E6EDF5',
                backgroundColor: 'rgba(19, 43, 68, 0.3)'
              }}
              asChild
            >
              <Link to="/login">
                View Demo
              </Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: MessageSquare,
                title: "Conversational AI",
                description: "Engage in natural conversations with your documents",
              },
              {
                icon: Zap,
                title: "Intelligent Extraction",
                description: "Automatically extract key insights and summaries",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data remains private and confidential",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <div
                  key={index}
                  className="relative group"
                >
                  <div
                    className="relative p-8 rounded-2xl border transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                    style={{
                      backgroundColor: '#132B44',
                      borderColor: '#1E3A5A',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Gold accent on hover */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(201, 162, 77, 0.1), rgba(201, 162, 77, 0.05))',
                        borderColor: '#C9A24D',
                      }}
                    />
                    
                    <div 
                      className="relative p-4 mb-4 w-16 h-16 mx-auto rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300"
                      style={{
                        backgroundColor: '#C9A24D',
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: '#0B1C2D' }} />
                    </div>
                    <h3 
                      className="text-xl font-bold mb-3"
                      style={{ color: '#E6EDF5' }}
                    >
                      {feature.title}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: '#9FB2C8' }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 py-4 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-sm">
          <p style={{ color: '#9FB2C8' }}>&copy; 2026 RAGfolio. All rights reserved.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link 
              to="#" 
              className="transition-colors hover:opacity-80"
              style={{ color: '#9FB2C8' }}
            >
              Terms of Service
            </Link>
            <Link 
              to="#" 
              className="transition-colors hover:opacity-80"
              style={{ color: '#9FB2C8' }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;