import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, MessageSquare, BarChart3, Zap, Sparkles, BookOpen,
  Shield, Upload, Search, Cpu, CheckCircle2, ArrowRight, Layers, Bot,
  Github, Twitter, Linkedin, Mail,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const primaryLink = isAuthenticated ? '/dashboard' : '/register';
  const primaryText = isAuthenticated ? 'Go to Dashboard' : 'Get Started Free';

  return (
    <div className="bg-white">

      <section className="relative overflow-hidden bg-gradient-to-br from-[#f7f5ff] via-white to-[#eef0ff]">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(108,92,231,0.18) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(162,155,254,0.22) 0%, transparent 45%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Retrieval-Augmented Generation
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-gray-900 leading-[1.08]">
                Chat with your PDFs.
                <br />
                <span className="bg-gradient-to-r from-[#6c5ce7] via-[#8a7ff0] to-[#a29bfe] bg-clip-text text-transparent">
                  Cited answers. Zero hallucination.
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                DocMind turns static PDFs into a conversational knowledge base.
                Upload a document, ask questions in plain English, and get
                answers grounded in <strong>your content</strong> with
                page-level citations every single time.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={primaryLink}
                  className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3"
                >
                  {primaryText} <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-purple-300 hover:text-purple-700 hover:shadow-sm transition"
                >
                  See what it does
                </a>
                <a
                  href="https://github.com/kanhaiyaray/Docmind-Ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-purple-300 hover:text-purple-700 hover:shadow-sm transition"
                >
                  <Github className="h-4 w-4" /> Star on GitHub
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Free to use
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Open source
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-[#6c5ce7]/20 to-[#a29bfe]/25 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-purple-100 border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-3 text-xs text-gray-400 font-mono">docmind chat</div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">research-paper.pdf</div>
                      <div className="text-[11px] text-gray-400">42 pages - Ready</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ready</span>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-3.5 py-2 rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] text-white text-xs leading-relaxed shadow-sm">
                      What are the key findings?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 text-gray-700 text-xs leading-relaxed">
                      The study identifies three main findings: (1) transformer models outperform baselines by 23%, (2) domain fine-tuning improves accuracy, (3) retrieval quality dominates model size.
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600 font-semibold">
                        <FileText className="h-3 w-3" /> Sources: Page 12, Page 27
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">Ask a question about this document...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Stat label="Cited Answers" value="100%" />
            <Stat label="RAG Pipeline" value="6-Stage" />
            <Stat label="File Size Cap" value="10 MB" />
            <Stat label="Setup Time" value="< 1 min" />
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Everything you need"
            title="A complete document intelligence workspace"
            subtitle="From uploading your first PDF to comparing multiple documents, DocMind handles the entire knowledge workflow."
          />

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<MessageSquare className="h-5 w-5" />} title="Conversational Q&A" description="Ask anything about your PDF in natural language. Answers are grounded in retrieved passages, never in the model imagination." accent="purple" />
            <FeatureCard icon={<FileText className="h-5 w-5" />} title="Page-Level Citations" description="Every answer comes with clickable source references pointing back to the exact page. Trace any claim to its origin." accent="blue" />
            <FeatureCard icon={<Layers className="h-5 w-5" />} title="Multi-Document Chat" description="Select 2-3 documents and ask a single question across all of them. DocMind blends context and cites each source." accent="indigo" />
            <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Document Comparison" description="Instantly surface themes, similarities, differences, and complementary insights between any two or three PDFs." accent="pink" />
            <FeatureCard icon={<Zap className="h-5 w-5" />} title="Quiz Generator" description="Turn any document into a multiple-choice, true/false, or fill-in-the-blank quiz with adjustable difficulty." accent="amber" />
            <FeatureCard icon={<BookOpen className="h-5 w-5" />} title="AI Flashcards" description="Generate elegant 3D flip flashcards with keyboard navigation. Perfect for revision and spaced repetition." accent="green" />
            <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Smart Summaries" description="Get an executive summary of any document on demand, no more skimming hundreds of pages." accent="violet" />
            <FeatureCard icon={<Shield className="h-5 w-5" />} title="Production Security" description="JWT in HTTP-only cookies, CSRF protection, rotating refresh tokens, per-device session control, and full audit logs." accent="slate" />
            <FeatureCard icon={<Bot className="h-5 w-5" />} title="Adaptive Retrieval" description="Small docs skip vector search; large docs get a hard 60k-char context cap. The pipeline picks the right strategy per document." accent="cyan" />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-gradient-to-b from-[#faf9ff] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="From PDF to cited answer in four steps"
            subtitle="Under the hood, DocMind runs a full Retrieval-Augmented Generation pipeline built from scratch."
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard n="01" icon={<Upload className="h-5 w-5" />} title="Upload" description="Drag and drop any text-based PDF (up to 10 MB). Image-only PDFs are detected and rejected early." />
            <StepCard n="02" icon={<Cpu className="h-5 w-5" />} title="Process" description="Text is extracted page-by-page, split into semantic chunks, and vectorized with 1536-dim embeddings." />
            <StepCard n="03" icon={<Search className="h-5 w-5" />} title="Retrieve" description="Your question is embedded and matched against the chunk store with MongoDB Atlas Vector Search." />
            <StepCard n="04" icon={<MessageSquare className="h-5 w-5" />} title="Answer" description="Retrieved passages are injected into the prompt as labelled POSITION blocks. The LLM cites pages." />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built on a modern stack"
            title="Production-grade tech, end to end"
            subtitle="Every layer is chosen for reliability, security, and cost-effectiveness, from React on the frontend to MongoDB Atlas on the backend."
          />
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React 18', note: 'UI framework' },
              { name: 'Vite', note: 'Build tool' },
              { name: 'TailwindCSS', note: 'Styling' },
              { name: 'React Router', note: 'Routing' },
              { name: 'Node.js', note: 'Runtime' },
              { name: 'Express', note: 'API framework' },
              { name: 'MongoDB Atlas', note: 'DB + vector store' },
              { name: 'OpenAI', note: 'Embeddings + chat' },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-purple-200 hover:shadow-sm transition p-4">
                <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6c5ce7] via-[#7c6cf0] to-[#a29bfe] px-6 py-14 sm:px-14 sm:py-16">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.6) 0%, transparent 40%)',
              }}
            />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Ready to chat with your documents?
              </h2>
              <p className="mt-4 text-white/85 text-base sm:text-lg leading-relaxed">
                Create a free account, upload your first PDF, and get your first
                cited answer in under a minute. No credit card required.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/register'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-700 font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <span className="text-xs text-white/70 font-medium uppercase tracking-wider">Connect</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://github.com/kanhaiyaray"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="GitHub"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                  <a
                    href="https://x.com/kanhaiyaraymps"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="Twitter / X"
                    title="Twitter / X"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/raykanhaiya/"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href="mailto:samkanhaiya@gmail.com"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="Email"
                    title="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] bg-clip-text text-transparent">
      {value}
    </div>
    <div className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{label}</div>
  </div>
);

const SectionHeading = ({ eyebrow, title, subtitle }) => (
  <div className="max-w-2xl mx-auto text-center">
    <div className="inline-block text-xs font-bold tracking-wider uppercase text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
      {eyebrow}
    </div>
    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-4 text-gray-600 leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const accentMap = {
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  pink: 'bg-pink-50 text-pink-600 border-pink-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
};

const FeatureCard = ({ icon, title, description, accent = 'purple' }) => (
  <div className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-50 transition-all">
    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${accentMap[accent]}`}>
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ n, icon, title, description }) => (
  <div className="relative rounded-2xl border border-gray-100 bg-white p-6">
    <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white text-[10px] font-bold tracking-wider">
      STEP {n}
    </div>
    <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-4 mt-2">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
