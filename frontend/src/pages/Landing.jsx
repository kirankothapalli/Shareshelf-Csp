import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import ListingCard from '../components/ListingCard.jsx';
import Loader from '../components/Loader.jsx';
import { ScrollReveal } from '../hooks/useScrollReveal.jsx';
import useScrollReveal from '../hooks/useScrollReveal.jsx';
import useCountUp from '../hooks/useCountUp.js';

/* ── SVG Icons (inline, no deps) ── */
const IconVerify = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EDF5EE"/>
    <path d="M21 12L14.5 19L11 15.5" stroke="#2F5233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconList = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FFF5EB"/>
    <rect x="10" y="11" width="12" height="2" rx="1" fill="#C97A3D"/>
    <rect x="10" y="15" width="9" height="2" rx="1" fill="#C97A3D"/>
    <rect x="10" y="19" width="11" height="2" rx="1" fill="#C97A3D"/>
  </svg>
);
const IconClaim = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EDF5EE"/>
    <path d="M16 11V21M11 16H21" stroke="#2F5233" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconMeet = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FFF5EB"/>
    <circle cx="13" cy="14" r="2.5" stroke="#C97A3D" strokeWidth="1.5"/>
    <circle cx="19" cy="14" r="2.5" stroke="#C97A3D" strokeWidth="1.5"/>
    <path d="M10 22C10 19.5 11.5 18 13 18C14 18 15 18 16 18C17 18 18 18 19 18C20.5 18 22 19.5 22 22" stroke="#C97A3D" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const STEPS = [
  {
    icon: <IconVerify />,
    num: '01',
    title: 'Verify your identity',
    desc: 'Students verify with a college ID or fee receipt. Schools and NGOs verify with official institution documents.',
  },
  {
    icon: <IconList />,
    num: '02',
    title: 'List or request',
    desc: 'Post items to donate or sell at low cost, or add what you need to the community wishlist board.',
  },
  {
    icon: <IconClaim />,
    num: '03',
    title: 'Request to claim',
    desc: 'Contact details and a safe public meetup point are only shared once the lister accepts your request.',
  },
  {
    icon: <IconMeet />,
    num: '04',
    title: 'Meet & rate',
    desc: 'Meet in person, hand over the item, then rate each other so community trust grows with every exchange.',
  },
];

const TESTIMONIALS = [
  {
    quote: "A pile of old textbooks and a scientific calculator sat in my cupboard for two years. It took me ten minutes to list them here.",
    name: 'Rohan K.',
    role: 'Final-year engineering student',
  },
  {
    quote: "I found a ₹900 reference book and a drafting board for free within 3km of my hostel. ShareShelf is genuinely life-changing.",
    name: 'Meera S.',
    role: 'B.Sc. Chemistry, 2nd year',
  },
  {
    quote: "As a parent, I love that my daughter's old study materials and lab coat reach someone who actually needs them.",
    name: 'Sunitha R.',
    role: 'Parent of a student',
  },
];

const TRUST_POINTS = [
  { icon: '🛡️', title: 'Verified users', desc: 'Every student verifies with an official college ID before they can list or claim.' },
  { icon: '📍', title: 'Hyperlocal & in-person', desc: 'All exchanges are within 20km and happen face-to-face at public meetup points.' },
  { icon: '🔒', title: 'Privacy first', desc: 'ID documents are deleted immediately after admin review. Only a hash is retained.' },
  { icon: '⭐', title: 'Community ratings', desc: 'Both parties rate each other after every exchange, building visible trust scores.' },
];

function StatCounter({ end, suffix = '', label }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
  const value = useCountUp(end, { shouldStart: isVisible, duration: 2200 });
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl md:text-5xl font-bold text-forest counter-value">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-muted mt-2 font-medium">{label}</p>
    </div>
  );
}

export default function Landing() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    api
      .get('/listings', { params: { sort: 'newest', limit: 6 } })
      .then((res) => setListings(res.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Warm up geolocation permission for later Browse page visit
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).catch(() => {});
    }
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ── HERO ── */}
      <section className="gradient-hero relative min-h-[85vh] flex items-center">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-forest/5 animate-float-slow" />
          <div className="absolute bottom-20 -left-16 w-72 h-72 rounded-full bg-amber-50 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-sage/30 animate-pulse-soft" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <ScrollReveal variant="up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-forest bg-forest-50 px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-forest rounded-full animate-pulse-soft" />
                Hyperlocal · Verified
              </span>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.4rem] font-semibold leading-[1.15] text-ink">
                A lack of resources shouldn't hold any student{' '}
                <span className="gradient-text-forest">back.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={200}>
              <p className="mt-6 text-lg text-ink/65 max-w-lg leading-relaxed">
                ShareShelf connects students who need books, gear, and study materials with
                seniors, schools, and neighbors nearby who have them to give — donated
                free or sold at a fraction of the price.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={300}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/browse"
                  className="btn-primary bg-forest text-white font-medium px-7 py-3.5 rounded-full hover:bg-forest-dark transition-all text-sm inline-flex items-center gap-2"
                >
                  Browse nearby listings
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <Link
                  to="/create-listing"
                  className="font-medium px-7 py-3.5 rounded-full border border-ink/15 hover:bg-sage/40 transition-all text-sm hover-lift"
                >
                  Donate or sell an item
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right column — testimonial card */}
          <ScrollReveal variant="right" delay={200}>
            <div className="relative">
              <div className="gradient-forest rounded-3xl p-8 md:p-10 text-white shadow-elevated-lg hover-glow">
                <div className="text-5xl opacity-20 font-display leading-none mb-2">"</div>
                <div className="relative min-h-[120px]">
                  {TESTIMONIALS.map((t, i) => (
                    <div
                      key={i}
                      className={`absolute inset-0 transition-all duration-500 ${
                        i === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                      }`}
                    >
                      <p className="font-display text-xl md:text-2xl leading-snug">{t.quote}</p>
                      <p className="mt-5 text-sm text-white/60">
                        — {t.name}, {t.role}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Dots */}
                <div className="flex gap-2 mt-8">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === activeTestimonial ? 'bg-white w-6' : 'bg-white/30'
                      }`}
                      aria-label={`Show testimonial ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-4 glass-card rounded-2xl px-5 py-4 shadow-elevated hidden sm:flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xl font-display font-bold text-forest">20km</p>
                  <p className="text-xs text-muted">radius, in-person only</p>
                </div>
              </div>

              {/* Second floating badge */}
              <div className="absolute -top-4 -right-3 glass-card rounded-xl px-4 py-3 shadow-elevated hidden md:flex items-center gap-2 animate-float-slow">
                <span className="text-lg">✅</span>
                <p className="text-xs font-medium text-forest">Verified community</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section className="py-16 md:py-20 border-y border-ink/5 bg-card">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <StatCounter end={2400} suffix="+" label="Items shared" />
          <StatCounter end={1850} suffix="+" label="Students helped" />
          <StatCounter end={45} label="Communities reached" />
          <StatCounter end={92} suffix="%" label="Donation rate" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <span className="text-xs font-semibold tracking-wide uppercase text-amber-dark bg-amber-50 px-3 py-1 rounded-full">
              Simple process
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4">
              Four steps to make an impact
            </h2>
            <p className="text-muted mt-3 max-w-md mx-auto">
              Whether you're donating or looking for study materials, the process is
              designed to be safe, fast, and community-driven.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.num} variant="up" delay={i * 100}>
                <div className="group relative glass-card rounded-2xl p-6 hover-lift cursor-default h-full">
                  {/* Step number watermark */}
                  <span className="absolute top-4 right-4 text-4xl font-display font-bold text-ink/[0.04]">
                    {step.num}
                  </span>
                  <div className="mb-4">{step.icon}</div>
                  <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-forest transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink/60 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT LISTINGS ── */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-semibold">
                  Recently listed nearby
                </h2>
                <p className="text-sm text-muted mt-1">
                  Fresh additions from your community
                </p>
              </div>
              <Link
                to="/browse"
                className="text-sm font-medium text-forest hover:text-forest-dark transition-colors inline-flex items-center gap-1 animated-underline"
              >
                See all
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </ScrollReveal>

          {loading ? (
            <Loader label="Loading listings…" />
          ) : listings.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-16 glass-card rounded-2xl">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-muted font-medium">No listings yet — be the first to donate something.</p>
                <Link to="/create-listing" className="inline-block mt-4 text-sm font-medium text-forest animated-underline">
                  Create a listing →
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((l, i) => (
                <ScrollReveal key={l._id} variant="up" delay={i * 100}>
                  <ListingCard listing={l} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST & SAFETY ── */}
      <section className="py-20 md:py-28 bg-sage-50">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal className="text-center mb-14">
            <span className="text-xs font-semibold tracking-wide uppercase text-forest bg-forest-50 px-3 py-1 rounded-full">
              Built on trust
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4">
              Safety is not an afterthought
            </h2>
            <p className="text-muted mt-3 max-w-md mx-auto">
              Every feature is designed with student safety and privacy at its core.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST_POINTS.map((tp, i) => (
              <ScrollReveal key={tp.title} variant="scale" delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 shadow-inner-soft hover-lift h-full border border-ink/5">
                  <span className="text-3xl block mb-4">{tp.icon}</span>
                  <h3 className="font-display font-semibold text-base mb-2">{tp.title}</h3>
                  <p className="text-sm text-ink/60 leading-relaxed">{tp.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">
              Stories from the community
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={i} variant="up" delay={i * 150}>
                <div className="glass-card rounded-2xl p-6 hover-lift h-full flex flex-col">
                  <div className="text-3xl text-forest/20 font-display leading-none mb-2">"</div>
                  <p className="text-sm text-ink/80 leading-relaxed flex-1">{t.quote}</p>
                  <div className="mt-5 pt-4 border-t border-ink/5">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <ScrollReveal variant="scale">
            <div className="gradient-forest rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

              <div className="relative z-10">
                <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
                  Every resource deserves a second life.
                </h2>
                <p className="mt-4 text-white/65 max-w-lg mx-auto">
                  Join a growing community of students and neighbors turning idle
                  textbooks into real opportunities. It takes less than a minute.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/signup"
                    className="bg-white text-forest font-medium px-8 py-3.5 rounded-full hover:bg-white/90 transition-all text-sm shadow-elevated hover-lift inline-flex items-center gap-2"
                  >
                    Get started free
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                  <Link
                    to="/browse"
                    className="border border-white/25 text-white font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-all text-sm"
                  >
                    Browse listings
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
