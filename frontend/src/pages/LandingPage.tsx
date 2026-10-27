import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Semester } from '../types';
import {
  Compass,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileText,
  Bookmark,
  ShieldCheck,
  Cpu,
  GraduationCap,
  FolderGit2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { TiltCard } from '../components/3d/TiltCard';
import { IsometricHeroGraphic } from '../components/3d/IsometricHeroGraphic';

export const LandingPage: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Semester[]>('/semesters')
      .then((res: { data: Semester[] }) => setSemesters(res.data))
      .catch((err: any) => console.error('Failed to load semesters', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { title: 'Class Notes', desc: 'Faculty-approved lecture summaries & slides', icon: FileText, color: 'text-indigo-600 bg-indigo-50/80' },
    { title: 'Important Q&A Bank', desc: 'Curated short & long questions with verified answers', icon: HelpCircle, color: 'text-amber-600 bg-amber-50/80' },
    { title: 'Lab Manuals', desc: 'Step-by-step algorithms, experiments & datasets', icon: Cpu, color: 'text-emerald-600 bg-emerald-50/80' },
    { title: 'Textbook References', desc: 'Prescribed standard books, ISBNs & library references', icon: BookOpen, color: 'text-sky-600 bg-sky-50/80' },
    { title: 'Previous Year Papers', desc: 'Authentic semester exam model question papers', icon: Layers, color: 'text-purple-600 bg-purple-50/80' },
    { title: 'Syllabus & Schemes', desc: 'Official unit breakdowns and credit distributions', icon: FolderGit2, color: 'text-rose-600 bg-rose-50/80' },
  ];

  const faqs = [
    {
      q: 'How do students get their account credentials?',
      a: 'Student accounts are securely provisioned by assigned department faculty members. Faculty assign roll numbers and initial credentials so you can log in directly.',
    },
    {
      q: 'Can anyone upload study materials to the platform?',
      a: 'No. Only authorized faculty and department staff can upload educational materials. All submissions undergo Head of Department (HOD) review before publication.',
    },
    {
      q: 'How does the HOD Transfer feature work?',
      a: 'When department leadership transitions, the current HOD can securely transfer their role to an active faculty member with two-way password verification, automatically updating permissions without any external admin panel.',
    },
    {
      q: 'Can students track their topic learning progress?',
      a: 'Yes! Students can check off completed notes, bookmark important questions, and view a visual completion progress bar across each semester.',
    },
  ];

  return (
    <div className="space-y-28 pb-24 overflow-x-hidden">
      {/* 3D Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Layered glowing background blobs */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-brand-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-purple-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Artificial Intelligence & Machine Learning Engineering
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Your Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-500">AI & Machine Learning</span> Academic Roadmap
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Explore semester-wise learning resources, academic notes, important questions, textbook references, and structured study materials from Semester 1 to Semester 8.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/semesters"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 rounded-2xl shadow-xl shadow-brand-600/25 hover:shadow-2xl hover:shadow-brand-600/40 hover:-translate-y-0.5 transition-all"
                >
                  Explore Roadmap
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-slate-700 bg-white/90 hover:bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all backdrop-blur-md"
                >
                  Portal Login
                </Link>
              </div>

              {/* 3D Glassmorphic Quick Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
                <div className="glass-panel p-3.5 rounded-2xl">
                  <GraduationCap className="w-5 h-5 text-brand-600 mb-1" />
                  <div className="font-extrabold text-slate-900 text-sm">8 Semesters</div>
                  <div className="text-[11px] text-slate-500 font-medium">Full Curriculum</div>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
                  <div className="font-extrabold text-slate-900 text-sm">HOD Verified</div>
                  <div className="text-[11px] text-slate-500 font-medium">Quality Queue</div>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl">
                  <Cpu className="w-5 h-5 text-indigo-600 mb-1" />
                  <div className="font-extrabold text-slate-900 text-sm">Q&A Bank</div>
                  <div className="text-[11px] text-slate-500 font-medium">With Answers</div>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl">
                  <Bookmark className="w-5 h-5 text-purple-600 mb-1" />
                  <div className="font-extrabold text-slate-900 text-sm">3D Progress</div>
                  <div className="text-[11px] text-slate-500 font-medium">Topic Tracking</div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Isometric Animated Graphic */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <IsometricHeroGraphic />
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Semester 1–8 Roadmap Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" /> Interactive 3D Roadmap
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Explore Semester 1 through Semester 8
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Hover over any semester to experience real-time 3D perspective depth, subject counts, and learning resources.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-52 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {semesters.map((sem) => (
              <TiltCard key={sem.id} maxTilt={12} scale={1.03}>
                <Link
                  to={`/semesters/${sem.id}`}
                  className="group block h-full p-6 rounded-3xl glass-panel glass-panel-hover preserve-3d flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-4 preserve-3d">
                    <div className="flex items-center justify-between preserve-3d">
                      <span 
                        className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-base shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform preserve-3d"
                        style={{ transform: 'translateZ(25px)' }}
                      >
                        S{sem.id}
                      </span>
                      <span 
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100/80 text-slate-600 border border-slate-200/60 preserve-3d"
                        style={{ transform: 'translateZ(15px)' }}
                      >
                        {sem.academic_year || '2024–2028'}
                      </span>
                    </div>

                    <div className="preserve-3d" style={{ transform: 'translateZ(20px)' }}>
                      <h3 className="font-extrabold text-slate-900 text-xl group-hover:text-brand-600 transition-colors">
                        {sem.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {sem.subjects_count} {sem.subjects_count === 1 ? 'Subject' : 'Subjects'} Registered
                      </p>
                    </div>
                  </div>

                  <div 
                    className="pt-5 mt-4 border-t border-slate-100/80 flex items-center justify-between text-xs font-bold text-brand-600 preserve-3d"
                    style={{ transform: 'translateZ(25px)' }}
                  >
                    <span>{sem.materials_count} Study Materials</span>
                    <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </TiltCard>
            ))}
          </div>
        )}
      </section>

      {/* 3D Glassmorphic Study Material Categories */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Curated Educational Resources
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Everything required for academic preparation, structured systematically by subject and unit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <TiltCard key={idx} maxTilt={8} scale={1.02}>
                  <div className="glass-panel glass-panel-hover h-full p-6 rounded-3xl flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl shrink-0 shadow-sm ${cat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{cat.title}</h4>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3D Isometric How The Portal Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How The Portal Works
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            A transparent 3-tier academic workflow connecting leadership, faculty, and engineering students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <TiltCard maxTilt={6}>
            <div className="glass-panel p-8 rounded-3xl text-center space-y-4 h-full flex flex-col justify-between">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/10">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">HOD Department Oversight</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The HOD organizes semester subjects, provisions faculty accounts, and reviews submitted study materials in the approval queue.
              </p>
            </div>
          </TiltCard>

          {/* Step 2 */}
          <TiltCard maxTilt={6}>
            <div className="glass-panel p-8 rounded-3xl text-center space-y-4 h-full flex flex-col justify-between">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-sky-600 font-black text-xl flex items-center justify-center shadow-md shadow-sky-500/10">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Faculty Resource Uploads</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Teachers upload lecture notes, lab manuals, and question banks, and provision credentials for their enrolled students.
              </p>
            </div>
          </TiltCard>

          {/* Step 3 */}
          <TiltCard maxTilt={6}>
            <div className="glass-panel p-8 rounded-3xl text-center space-y-4 h-full flex flex-col justify-between">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/10">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Student Academic Mastery</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Students access approved notes, study model answers, bookmark key topics, and track their subject completion progress.
              </p>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-600">
            Common questions regarding portal access and academic management.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-900 text-base">{faq.q}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
