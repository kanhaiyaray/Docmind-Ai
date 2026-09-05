import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Zap, Shield, ArrowRight, Play } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4 text-secondary-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Document Intelligence</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Transform Your
              <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent block">
                Documents into Insights
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Upload PDFs, ask questions, and get intelligent answers with page citations. 
              Your personal AI research assistant powered by RAG and Gemini.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/documents')}
                className="group relative px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center space-x-2">
                <Play className="h-5 w-5 text-primary-500" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="flex items-center space-x-2">
                <div className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100">
                  <Zap className="h-5 w-5 text-secondary-500" />
                </div>
                <span className="text-sm text-gray-600">Real-time AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100">
                  <Shield className="h-5 w-5 text-accent-500" />
                </div>
                <span className="text-sm text-gray-600">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100">
                  <FileText className="h-5 w-5 text-primary-500" />
                </div>
                <span className="text-sm text-gray-600">Page Citations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-sm text-gray-600">Multiple Documents</span>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative">
              <div className="absolute -top-10 -left-10 bg-white rounded-2xl shadow-2xl p-4 animate-float">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 rounded-xl p-2">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Climate_Report.pdf</p>
                    <p className="text-xs text-gray-500">12 pages • 2.4 MB</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-20 -right-10 bg-white rounded-2xl shadow-2xl p-4 animate-float animation-delay-2000">
                <div className="flex items-center space-x-3">
                  <div className="bg-secondary-100 rounded-xl p-2">
                    <Sparkles className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI Analysis</p>
                    <p className="text-xs text-gray-500">Processing complete</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 shadow-2xl shadow-primary-500/30">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <span className="text-white/60 text-xs">DocMind AI</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-white/80 text-sm">What are the main causes of climate change?</p>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-gray-800 text-sm">The document identifies greenhouse gas emissions, fossil fuel combustion, deforestation, and industrial activity as major contributors.</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="text-xs text-primary-600">📄 Page 12</span>
                        <span className="text-xs text-primary-600">📄 Page 18</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
