import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {

    // --- Smooth Scroll Function ---
    const scrollToSection = (e, sectionId) => {
        e.preventDefault(); // Prevent default anchor jump
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="bg-background-light font-sans text-foreground-light">
            <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
                {/* --- Header --- */}
                <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200/50 bg-background-light/80 px-4 py-3 backdrop-blur-lg sm:px-6 lg:px-10">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-md">
                            <span className="material-symbols-outlined text-xl"> nutrition </span>
                        </div>
                        <h2 className="text-2xl font-bold font-display text-foreground-light">Nutrilens</h2>
                    </div>
                    {/* --- Updated Nav Links for Smooth Scroll --- */}
                    <nav className="hidden items-center gap-8 md:flex">
                        <a
                            className="text-sm font-medium text-muted-light transition-colors hover:text-primary cursor-pointer"
                            href="#home"
                            onClick={(e) => scrollToSection(e, 'home')}
                        >
                            Home
                        </a>
                        <a
                            className="text-sm font-medium text-muted-light transition-colors hover:text-primary cursor-pointer"
                            href="#features"
                            onClick={(e) => scrollToSection(e, 'features')}
                        >
                            Features
                        </a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-primary/50 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
                            <span className="truncate">Login</span>
                        </Link>
                        <Link to="/signup" className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-4 text-sm font-bold text-black shadow-lg shadow-primary/30 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-primary/40">
                            <span className="truncate">Sign Up</span>
                        </Link>
                        {/* Mobile Menu Button (functionality not added yet) */}
                        <button className="rounded-full p-2 text-muted-light md:hidden">
                            <span className="material-symbols-outlined"> menu </span>
                        </button>
                    </div>
                </header>

                <main className="flex-1">
                    {/* --- Hero Section --- */}
                    <section id="home" className="relative"> {/* Added id="home" */}
                        <div className="absolute inset-0 z-0">
                            <img alt="A vibrant and healthy meal" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop" />
                            <div className="absolute inset-0 bg-linear-to-t from-background-light via-background-light/70 to-transparent"></div>
                        </div>
                        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-32 sm:px-6 sm:pt-32 sm:pb-40 lg:px-8 lg:pt-40 lg:pb-48">
                            <div className="mx-auto max-w-xl text-center">
                                <h1 className="font-display text-5xl font-bold tracking-tight text-foreground-light sm:text-6xl lg:text-7xl">Your AI Nutritionist</h1>
                                <p className="mt-6 text-lg leading-8 text-muted-light">Know your meal nutrition instantly. Snap a photo, and let our AI do the rest. Your personal guide to healthier eating starts here.</p>
                                <div className="mt-10 flex items-center justify-center gap-x-6">
                                    <Link to="/upload" className="flex h-14 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 text-lg font-bold text-black shadow-lg shadow-primary/40 transition-transform hover:scale-105">
                                        <span className="material-symbols-outlined"> photo_camera </span>
                                        <span className="truncate">Upload Meal</span>
                                    </Link>
                                    <Link to="/signup" className="group flex h-14 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-slate-300 bg-white/50 px-8 text-lg font-bold text-foreground-light backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white/70">
                                        <span className="truncate">Get Started</span>
                                         {/* Removed extra arrow span */}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- Features Section --- */}
                    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-slate-50"> {/* Added id="features" */}
                       {/* ... (Features content remains the same - ensure text-lg on h3) ... */}
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                          <div className="mx-auto max-w-3xl text-center">
                            <p className="text-base font-semibold uppercase tracking-wider text-primary">Features</p>
                            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground-light sm:text-5xl">Achieve Your Health Goals</h2>
                            <p className="mt-4 text-lg text-muted-light">Discover the powerful tools that make healthy eating simple and enjoyable.</p>
                          </div>
                          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Card 1 */}
                            <div className="transform rounded-xl border border-transparent bg-card-light p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30">
                              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-3xl"> calendar_month </span>
                              </div>
                              <h3 className="mt-6 text-lg font-bold text-foreground-light">Daily Tracking</h3>
                              <p className="mt-2 text-base text-muted-light">Log your meals effortlessly and monitor your daily calorie and nutrient intake.</p>
                            </div>
                            {/* Card 2 */}
                            <div className="transform rounded-xl border border-transparent bg-card-light p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30">
                              <div className="flex size-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                                <span className="material-symbols-outlined text-3xl"> history </span>
                              </div>
                              <h3 className="mt-6 text-lg font-bold text-foreground-light">Meal History</h3>
                              <p className="mt-2 text-base text-muted-light">Review your eating habits over time to identify patterns and make smarter choices.</p>
                            </div>
                             {/* Card 3 */}
                            <div className="transform rounded-xl border border-transparent bg-card-light p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30">
                              <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <span className="material-symbols-outlined text-3xl"> smart_toy </span>
                              </div>
                              <h3 className="mt-6 text-lg font-bold text-foreground-light">AI Diet Chatbot</h3>
                              <p className="mt-2 text-base text-muted-light">Get instant, personalized nutrition advice and meal plans from our friendly AI.</p>
                            </div>
                             {/* Card 4 */}
                            <div className="transform rounded-xl border border-transparent bg-card-light p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30">
                              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-3xl"> notifications_active </span>
                              </div>
                              <h3 className="mt-6 text-lg font-bold text-foreground-light">Smart Notifications</h3>
                              <p className="mt-2 text-base text-muted-light">Receive timely reminders and motivational tips to keep you on track.</p>
                            </div>
                          </div>
                        </div>
                    </section>

                    {/* --- Testimonials Section --- */}
                    <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-3xl text-center">
                                <h2 className="font-display text-4xl font-bold tracking-tight text-foreground-light sm:text-5xl">Loved by Health Enthusiasts</h2>
                            </div>
                            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {/* Card 1 */}
                                <div className="rounded-xl bg-background-light p-6 shadow-md transition-shadow hover:shadow-xl">
                                    <div className="flex items-center gap-4">
                                        {/* --- REPLACE with actual image URL or a placeholder service like DiceBear --- */}
                                        <img alt="Sophia Clark" className="size-14 rounded-full object-cover ring-2 ring-primary/50" src={`https://api.dicebear.com/8.x/adventurer/svg?seed=Sophia`} />
                                        <div>
                                            <p className="font-semibold text-foreground-light">Sophia Clark</p>
                                            <p className="text-sm text-muted-light">Fitness Blogger</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-secondary">
                                        {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined">star</span>)}
                                    </div>
                                    <p className="mt-4 text-muted-light">"Nutrilens has transformed my approach to nutrition..."</p> {/* Shortened */}
                                </div>
                                {/* Card 2 */}
                                <div className="rounded-xl bg-background-light p-6 shadow-md transition-shadow hover:shadow-xl">
                                    <div className="flex items-center gap-4">
                                         {/* --- REPLACE with actual image URL or a placeholder service like DiceBear --- */}
                                        <img alt="Ethan Bennett" className="size-14 rounded-full object-cover ring-2 ring-primary/50" src={`https://api.dicebear.com/8.x/adventurer/svg?seed=Ethan`} />
                                        <div>
                                            <p className="font-semibold text-foreground-light">Ethan Bennett</p>
                                            <p className="text-sm text-muted-light">Marathon Runner</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-secondary">
                                        {[...Array(4)].map((_, i) => <span key={i} className="material-symbols-outlined">star</span>)}
                                        <span className="material-symbols-outlined text-slate-300">star_outline</span>
                                    </div>
                                    <p className="mt-4 text-muted-light">"I appreciate the meal history feature..."</p> {/* Shortened */}
                                </div>
                                {/* Card 3 */}
                                <div className="rounded-xl bg-background-light p-6 shadow-md transition-shadow hover:shadow-xl">
                                    <div className="flex items-center gap-4">
                                         {/* --- REPLACE with actual image URL or a placeholder service like DiceBear --- */}
                                        <img alt="Olivia Carter" className="size-14 rounded-full object-cover ring-2 ring-primary/50" src={`https://api.dicebear.com/8.x/adventurer/svg?seed=Olivia`} />
                                        <div>
                                            <p className="font-semibold text-foreground-light">Olivia Carter</p>
                                            <p className="text-sm text-muted-light">Yoga Instructor</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-secondary">
                                        {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined">star</span>)}
                                    </div>
                                    <p className="mt-4 text-muted-light">"The app is user-friendly and provides valuable insights..."</p> {/* Shortened */}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- Call to Action Section --- */}
                    <section className="py-16 sm:py-20 lg:py-24">
                         {/* ... (CTA content remains the same) ... */}
                          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-green-600 p-8 text-center shadow-2xl shadow-primary/30 md:p-12">
                              <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10"></div>
                              <div className="absolute -bottom-16 -left-12 size-52 rounded-full bg-white/10"></div>
                              <div className="relative">
                                <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Start Your Health Journey Today</h2>
                                <p className="mt-4 text-lg text-green-100">Join Nutrilens and unlock the power of AI to achieve your nutrition goals.</p>
                                <div className="mt-8 flex justify-center">
                                  <Link to="/signup" className="flex h-14 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 text-lg font-bold text-primary shadow-lg transition-transform hover:scale-105">
                                    <span className="truncate">Sign Up Now</span>
                                    <span className="material-symbols-outlined"> east </span>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                    </section>
                </main>

                {/* --- Footer --- */}
                <footer className="border-t border-slate-200/50 bg-background-light">
                    {/* ... (Footer content remains the same) ... */}
                      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
                              <span className="material-symbols-outlined text-xl"> nutrition </span>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-foreground-light">Nutrilens</h2>
                          </div>
                          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                            {/* <Link className="text-muted-light transition-colors hover:text-primary" to="/about">About</Link> */}
                          </div>
                          <p className="text-sm text-muted-light">© 2025 Nutrilens. All rights reserved.</p>
                        </div>
                      </div>
                </footer>
            </div>
        </div>
    );
}