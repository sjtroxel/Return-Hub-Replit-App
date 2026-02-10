import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, useScroll } from "framer-motion";
import { ArrowRight, ChevronRight, ChevronLeft, DollarSign, Clock, Shield } from "lucide-react";
import { SiGithub } from "react-icons/si";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

export default function LandingPage() {
  const { user } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = 4;

  const { scrollXProgress } = useScroll({ container: containerRef });

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const scrollToSlide = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * window.innerWidth, behavior: "smooth" });
  };

  const goNext = () => {
    if (currentSlide < totalSlides - 1) scrollToSlide(currentSlide + 1);
  };

  const goPrev = () => {
    if (currentSlide > 0) scrollToSlide(currentSlide - 1);
  };

  const handleDemoClick = async () => {
    if (isDemoLoading) return;
    setIsDemoLoading(true);

    try {
      await apiRequest("POST", "/api/auth/demo");

      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ["#60a5fa", "#a78bfa", "#06b6d4", "#ffffff"],
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast.success("Welcome to your demo vault!");

      setTimeout(() => {
        setLocation("/dashboard");
      }, 800);
    } catch (error: any) {
      toast.error(error.message || "Failed to create demo. Please try again.");
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020617]">
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 z-50"
        style={{ scaleX: scrollXProgress, transformOrigin: "0%" }}
      />

      <FloatingOrbs />

      <ScrollContainer
        containerRef={containerRef}
        onSlideChange={setCurrentSlide}
      >
        <SlideWrapper>
          <Slide1Content onDemoClick={handleDemoClick} isDemoLoading={isDemoLoading} setLocation={setLocation} />
          <SlideFooter />
        </SlideWrapper>
        <SlideWrapper>
          <Slide2Content />
        </SlideWrapper>
        <SlideWrapper>
          <Slide3Content />
        </SlideWrapper>
        <SlideWrapper>
          <Slide4Content onDemoClick={handleDemoClick} isDemoLoading={isDemoLoading} setLocation={setLocation} />
          <SlideFooter />
        </SlideWrapper>
      </ScrollContainer>

      <SlideNavArrows
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onNext={goNext}
        onPrev={goPrev}
      />
    </div>
  );
}

function SlideNavArrows({
  currentSlide,
  totalSlides,
  onNext,
  onPrev,
}: {
  currentSlide: number;
  totalSlides: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  const showPrev = currentSlide > 0;
  const showNext = currentSlide < totalSlides - 1;

  return (
    <>
      {showPrev && (
        <motion.button
          className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex items-center justify-center w-12 h-12 rounded-full glass-panel cursor-pointer"
          onClick={onPrev}
          aria-label="Previous slide"
          data-testid="button-slide-prev"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="text-slate-300" size={28} />
        </motion.button>
      )}
      {showNext && (
        <motion.button
          className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex items-center justify-center w-12 h-12 rounded-full glass-panel cursor-pointer"
          onClick={onNext}
          aria-label="Next slide"
          data-testid="button-slide-next"
          animate={{ x: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="text-slate-300" size={28} />
        </motion.button>
      )}
    </>
  );
}

function SlideWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-w-full h-full snap-start snap-always flex items-center justify-center px-5 sm:px-16 md:px-24 py-2 sm:py-8 relative">
      {children}
    </section>
  );
}

function ScrollContainer({
  containerRef,
  onSlideChange,
  children,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSlideChange: (index: number) => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const index = Math.round(el.scrollLeft / window.innerWidth);
      onSlideChange(index);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, onSlideChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const slideWidth = window.innerWidth;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        el.scrollBy({ left: slideWidth, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        el.scrollBy({ left: -slideWidth, behavior: "smooth" });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        const currentIndex = Math.round(el.scrollLeft / window.innerWidth);
        if (e.deltaY > 0) {
          el.scrollTo({ left: (currentIndex + 1) * window.innerWidth, behavior: "smooth" });
        } else {
          el.scrollTo({ left: (currentIndex - 1) * window.innerWidth, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef]);

  let touchStartX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      const currentIndex = Math.round(containerRef.current.scrollLeft / window.innerWidth);
      if (diff > 0) {
        containerRef.current.scrollTo({ left: (currentIndex + 1) * window.innerWidth, behavior: "smooth" });
      } else {
        containerRef.current.scrollTo({ left: (currentIndex - 1) * window.innerWidth, behavior: "smooth" });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-row overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide"
      style={{ scrollBehavior: "smooth" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

function Slide1Content({
  onDemoClick,
  isDemoLoading,
  setLocation,
}: {
  onDemoClick: () => void;
  isDemoLoading: boolean;
  setLocation: (path: string) => void;
}) {
  return (
    <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 gradient-text"
          data-testid="text-landing-title"
        >
          Returns, Reimagined.
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-6 sm:mb-8 leading-relaxed">
          The automated vault for your unclaimed cash.
          <br />
          Stop guessing, start tracking.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            onClick={onDemoClick}
            disabled={isDemoLoading}
            className="
              relative overflow-hidden
              px-6 sm:px-8 py-3 sm:py-4
              bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600
              bg-size-200 bg-pos-0
              text-white font-semibold rounded-xl
              shadow-2xl shadow-blue-500/50
              hover:bg-pos-100 hover:shadow-purple-500/50
              transition-all duration-500
              disabled:opacity-50 disabled:cursor-not-allowed
              group
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-try-demo"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isDemoLoading ? "Creating Vault..." : "Try Demo"}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </span>

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-200%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </motion.button>

          <motion.button
            onClick={() => setLocation("/login")}
            className="
              px-6 sm:px-8 py-3 sm:py-4
              glass-panel
              text-white font-semibold rounded-xl
              hover:bg-white/10
              transition-all duration-300
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-login-slide1"
          >
            Log In
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative hidden lg:block"
      >
        <LivePreviewCard />
      </motion.div>
    </div>
  );
}

function SlideFooter() {
  return (
    <p className="absolute bottom-3 sm:bottom-5 left-0 right-0 text-center text-sm text-white">
      &copy; 2026 sjtroxel{" "}
      <a
        href="https://github.com/sjtroxel/Return-Hub-Replit-App"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center align-middle hover:text-slate-300 transition-colors"
        data-testid="link-github"
      >
        <SiGithub className="w-4 h-4" />
      </a>
      . All rights reserved.
    </p>
  );
}

function Slide2Content() {
  return (
    <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative h-48 sm:h-96 lg:h-[600px] rounded-2xl overflow-hidden glass-panel"
      >
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=1080&fit=crop"
          alt="Shipping packages cluttering doorstep"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-6 gradient-text-danger">
          $800 Billion Lost.
        </h2>

        <p className="text-base sm:text-xl md:text-2xl text-slate-300 leading-relaxed">
          That is the amount left on the table every year in unreturned goods.
          <br /><br />
          Your home shouldn't be a graveyard for items you don't want.
        </p>
      </motion.div>
    </div>
  );
}

function Slide3Content() {
  return (
    <div className="max-w-5xl w-full flex flex-col h-full justify-center">
      <motion.h2
        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-2 sm:mb-6 text-center gradient-text"
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        The Urgency Engine.
      </motion.h2>

      <p className="hidden sm:block text-base sm:text-lg text-slate-300 text-center mb-6 sm:mb-10 max-w-2xl mx-auto text-balance">
        Our dashboard uses visual countdowns that drain as deadlines approach. We don't just store data &mdash; we prioritize your profit.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-2 sm:gap-6 mt-2 sm:mt-0"
      >
        <div className="glass-panel rounded-2xl p-3 sm:p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-1 sm:mb-3">
            <Clock className="text-blue-400 flex-shrink-0" size={22} />
            <h3 className="text-base sm:text-2xl font-bold text-white">
              Draining Countdowns
            </h3>
          </div>
          <p className="text-slate-300 mb-2 sm:mb-4 text-xs sm:text-base">
            Progress bars drain to 0% as your return window closes.
          </p>

          <div className="space-y-2 sm:space-y-3">
            <div className="relative h-2.5 sm:h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "15%" }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs sm:text-sm text-red-400 font-medium">Due Tomorrow - Last Chance!</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-1 sm:mb-3">
            <DollarSign className="text-green-400 flex-shrink-0" size={22} />
            <h3 className="text-base sm:text-2xl font-bold text-white">
              Total Owed
            </h3>
          </div>
          <p className="text-slate-300 mb-1 sm:mb-4 text-xs sm:text-base">
            See how much money is tied up in returns.
          </p>
          <p className="text-2xl sm:text-4xl font-bold text-green-400">
            $628.98
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-3 sm:p-6 md:col-span-3">
          <div className="flex items-center gap-2 mb-1 sm:mb-3">
            <Shield className="text-purple-400 flex-shrink-0" size={22} />
            <h3 className="text-base sm:text-2xl font-bold text-white">
              Smart Daily Reminders
            </h3>
          </div>
          <p className="text-slate-300 mb-2 sm:mb-4 text-xs sm:text-base">
            Browser notifications at 9am when returns hit the red zone.
          </p>

          <div className="glass-panel-light rounded-lg p-2 sm:p-4 max-w-md">
            <div className="flex items-center sm:items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="font-semibold text-white text-xs sm:text-sm">Don't lose your money!</p>
                <p className="text-slate-300 text-xs mt-0.5 sm:mt-1">
                  Amazon return expires in 2 days. ($89.99)
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Slide4Content({
  onDemoClick,
  isDemoLoading,
  setLocation,
}: {
  onDemoClick: () => void;
  isDemoLoading: boolean;
  setLocation: (path: string) => void;
}) {
  return (
    <div className="max-w-4xl w-full text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 gradient-text">
          Ready to Reclaim?
        </h2>

        <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto text-balance">
          Join the vault. Experience the dashboard instantly with our 48-hour Guest Pass, or create a permanent account.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <motion.button
            onClick={onDemoClick}
            disabled={isDemoLoading}
            className="
              relative overflow-hidden
              w-full sm:w-auto
              px-8 sm:px-12 py-4 sm:py-6
              bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600
              text-white text-lg sm:text-xl font-bold rounded-2xl
              shadow-2xl shadow-purple-500/50
              hover:shadow-cyan-500/50
              transition-all duration-500
              disabled:opacity-50 disabled:cursor-not-allowed
              group
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-try-demo-slide4"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isDemoLoading ? "Creating Vault..." : "Try Demo"}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowRight size={24} />
              </motion.div>
            </span>

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-200%", "200%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
          </motion.button>

          <motion.button
            onClick={() => setLocation("/signup")}
            className="
              w-full sm:w-auto
              px-8 sm:px-12 py-4 sm:py-6
              glass-panel
              text-white text-lg sm:text-xl font-semibold rounded-2xl
              hover:bg-white/10
              transition-all duration-300
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="link-signup"
          >
            Sign Up
          </motion.button>
        </div>

        <p className="text-slate-400 mt-6 sm:mt-8">
          Already have an account?{" "}
          <button
            onClick={() => setLocation("/login")}
            className="text-blue-400 hover:text-blue-300 font-medium underline"
            data-testid="link-login"
          >
            Login
          </button>
        </p>

        <p className="text-sm text-slate-500 mt-4 sm:mt-6">
          Demo data auto-deletes after 48 hours. No email required.
        </p>
      </motion.div>
    </div>
  );
}

function LivePreviewCard() {
  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 max-w-md mx-auto"
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    >
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Amazon</h3>
          <p className="text-slate-400 text-sm">Nike Sneakers</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">$120.00</p>
        </div>
      </div>

      <motion.div
        className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full mb-4"
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-red-400 text-sm font-medium">1 day left</span>
      </motion.div>

      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
          initial={{ width: "100%" }}
          animate={{ width: "3%" }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </div>

      <p className="text-xs text-red-400 font-medium">
        Due Tomorrow - Last Chance!
      </p>
    </motion.div>
  );
}

function FloatingOrbs() {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full bg-indigo-600 opacity-20 blur-3xl"
          style={{ top: "10%", left: "10%" }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500 opacity-15 blur-3xl"
          style={{ top: "50%", right: "10%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full bg-violet-600 opacity-25 blur-3xl"
          style={{ bottom: "15%", left: "40%" }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-indigo-600 opacity-20 blur-3xl floating-orb"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 120, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-cyan-500 opacity-15 blur-3xl floating-orb"
        style={{ willChange: "transform", transform: "translateZ(0)", top: "30%", right: "5%" }}
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 100, -60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-64 sm:w-[400px] h-64 sm:h-[400px] rounded-full bg-violet-600 opacity-25 blur-3xl floating-orb"
        style={{ willChange: "transform", transform: "translateZ(0)", bottom: "10%", left: "30%" }}
        animate={{
          x: [0, 60, -100, 0],
          y: [0, -50, 80, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
