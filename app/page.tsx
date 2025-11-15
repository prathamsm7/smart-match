'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Target, TrendingUp, CheckCircle, ArrowRight, Menu, X, Users, Brain, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function SmartResumeLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Matching",
      description: "Advanced algorithms analyze your skills and match you with perfect opportunities"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Smart Resume Builder",
      description: "Create stunning, ATS-friendly resumes that stand out to recruiters"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Precision Targeting",
      description: "Get matched with jobs that align with your career goals and expertise"
    }
  ];

  const stats = [
    { number: "50K+", label: "Jobs Matched" },
    { number: "98%", label: "Match Accuracy" },
    { number: "15K+", label: "Happy Users" },
    { number: "500+", label: "Top Companies" }
  ];

  const benefits = [
    "Instant resume optimization",
    "Real-time job matching",
    "Interview preparation tips",
    "Career growth insights",
    "Personalized recommendations",
    "Application tracking"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Rocket className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SmartMatch
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-blue-400 transition">Features</a>
              <a href="#how" className="hover:text-blue-400 transition">How It Works</a>
              <Link href="/upload" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105">
                Get Started
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block hover:text-blue-400 transition">Features</a>
              <a href="#how" className="block hover:text-blue-400 transition">How It Works</a>
              <Link href="/upload" className="block w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6 animate-pulse">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm">AI-Powered Career Matching</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Your Dream Job
              <br />
              Is One Match Away
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Leverage AI to create the perfect resume and get matched with opportunities that align with your skills and aspirations
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/upload" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105 flex items-center space-x-2">
                <span>Start Matching Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-semibold hover:bg-white/20 transition">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Features for Your Success
            </h2>
            <p className="text-gray-400 text-lg">Everything you need to land your dream job</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl border transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  activeFeature === index
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg">Three simple steps to your dream career</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload Resume", desc: "Share your current resume or create one from scratch" },
              { step: "02", title: "AI Analysis", desc: "Our AI analyzes your skills and career preferences" },
              { step: "03", title: "Get Matched", desc: "Receive personalized job matches instantly" }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="text-7xl font-bold text-blue-500/20 mb-4">{item.step}</div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose SmartMatch?
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                We combine cutting-edge AI technology with deep industry insights to help you stand out in today's competitive job market.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-lg group-hover:text-blue-400 transition">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl p-8 border border-blue-500/30 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl">
                    <Users className="w-8 h-8 text-blue-400" />
                    <div>
                      <div className="font-semibold">15,000+ Active Users</div>
                      <div className="text-sm text-gray-400">Growing community</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                    <div>
                      <div className="font-semibold">98% Success Rate</div>
                      <div className="text-sm text-gray-400">Get matched faster</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl">
                    <Sparkles className="w-8 h-8 text-cyan-300" />
                    <div>
                      <div className="font-semibold">AI-Powered</div>
                      <div className="text-sm text-gray-400">Latest technology</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl p-12 border border-blue-500/30 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of professionals who found their dream jobs with SmartMatch
            </p>
            <Link href="/upload" className="inline-flex items-center space-x-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105">
              <span>Get Started for Free</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Rocket className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold text-white">SmartMatch</span>
          </div>
          <p>© 2024 SmartMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
