import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-50">RAGfolio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative flex items-center justify-center min-h-screen pt-16 text-center bg-white dark:bg-gray-900">
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 to-pink-500/20" />
          </div>
          <div className="container relative z-10 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl lg:text-7xl">
                Your Intelligent Document Companion
              </h1>
              <p className="max-w-2xl mx-auto mt-6 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
                RAGfolio is a cutting-edge RAG application that allows you to chat with your documents, extract key insights, and streamline your workflow.
              </p>
              <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Get Started for Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">
                    View Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white md:py-24 lg:py-32 dark:bg-gray-900">
          <div className="container px-4 mx-auto md:px-6">
            <div className="grid gap-12 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
                </div>
                <h3 className="mb-2 text-xl font-bold">Conversational AI</h3>
                <p className="text-gray-600 dark:text-gray-400">Engage in natural conversations with your documents to quickly find the information you need.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-4 mb-4 rounded-full bg-pink-100 dark:bg-pink-900/50">
                  <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="mb-2 text-xl font-bold">Intelligent Extraction</h3>
                <p className="text-gray-600 dark:text-gray-400">Automatically extract key insights, summaries, and data points from your documents.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-4 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="mb-2 text-xl font-bold">Secure & Private</h3>
                <p className="text-gray-600 dark:text-gray-400">Your documents are processed securely, ensuring your data remains private and confidential.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="py-6 bg-gray-100 dark:bg-gray-800">
        <div className="container flex flex-col items-center justify-between px-4 mx-auto md:flex-row md:px-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">&copy; 2026 RAGfolio. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="#" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;