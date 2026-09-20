import React from 'react';
import { FileText, Github, Mail, Twitter, Linkedin } from 'lucide-react';

const PublicFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" strokeWidth={2.4} />
            </div>
            <div className="leading-none">
              <span className="font-extrabold text-lg bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] bg-clip-text text-transparent">
                DocMind
              </span>
              <div className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">
                AI DOCUMENT INTELLIGENCE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/kanhaiyaray/Docmind-Ai"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 transition"
              aria-label="GitHub"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="mailto:samkanhaiya@gmail.com"
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 transition"
              aria-label="Email"
              title="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/kanhaiyaraymps"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 transition"
              aria-label="Twitter / X"
              title="Twitter / X"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/raykanhaiya/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 transition"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {year} DocMind AI. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Built with care by{' '}
            <a
              href="https://github.com/kanhaiyaray"
              target="_blank"
              rel="noreferrer"
              className="text-purple-600 hover:underline font-medium"
            >
              Kanhaiya Ray
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
