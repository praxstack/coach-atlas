/**
 * AppFooter - Enterprise footer with support widget
 * Matches Coach Atlas dark theme aesthetic
 */
import { Coffee, Github, Heart, Twitter } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface SupportConfig {
  kofi: string;
  razorpay: string;
  github: string;
}

const CONFIG: SupportConfig = {
  kofi: "https://ko-fi.com/praxlannister",
  razorpay: "https://razorpay.me/@prakharshekharparthasarthi",
  github: "https://github.com/sponsors/PrakharMNNIT",
};

type Region = "india" | "global";

export const AppFooter = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Detect region on mount
  useEffect(() => {
    const detectRegion = async () => {
      const cached = sessionStorage.getItem("support_region");
      if (cached) {
        setRegion(cached as Region);
        return;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json();
        const detected: Region = data?.country_code === "IN" ? "india" : "global";
        sessionStorage.setItem("support_region", detected);
        setRegion(detected);
      } catch {
        setRegion("global");
      }
    };

    detectRegion();
  }, []);

  // Show modal after delay (if not dismissed)
  useEffect(() => {
    const dismissed = localStorage.getItem("support_modal_dismissed");
    if (dismissed === "true") return;

    const timer = setTimeout(() => {
      setShowModal(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const toggleRegion = useCallback(() => {
    setRegion((prev) => {
      const next = prev === "india" ? "global" : "india";
      sessionStorage.setItem("support_region", next);
      return next;
    });
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    if (dontShowAgain) {
      localStorage.setItem("support_modal_dismissed", "true");
    }
  }, [dontShowAgain]);

  const isIndia = region === "india";

  return (
    <>
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground">
            {/* Made with love */}
            <span className="flex items-center gap-1.5">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by
              <a
                href="https://github.com/PrakharMNNIT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Prax Lannister
              </a>
            </span>

            <span className="hidden sm:inline text-border">|</span>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/PrakharMNNIT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="https://x.com/ByteByByteSrSDE"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">X (Twitter)</span>
              </a>
            </div>

            <span className="hidden sm:inline text-border">|</span>

            {/* Support Widget */}
            <div className="flex items-center gap-2">
              {region === null ? (
                <span className="px-4 py-1.5 rounded-full bg-muted animate-pulse text-xs">
                  Loading...
                </span>
              ) : (
                <>
                  <a
                    href={isIndia ? CONFIG.razorpay : CONFIG.kofi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold
                      text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
                      ${isIndia
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500"
                        : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                      }
                    `}
                  >
                    {isIndia ? "🇮🇳" : <Coffee className="w-3.5 h-3.5" />}
                    <span>{isIndia ? "Support via UPI" : "Support via Ko-fi"}</span>
                  </a>
                  <button
                    onClick={toggleRegion}
                    className="text-[10px] underline opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {isIndia ? "Not in India?" : "In India? Use UPI"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Support Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-card border border-border rounded-xl p-8 w-[90%] max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
            >
              ×
            </button>

            <div className="text-center">
              <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                <Coffee className="w-6 h-6 text-primary" />
                Support the Developer
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                If you find Coach Atlas useful, consider supporting its development!
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <a
                  href={CONFIG.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                >
                  <Heart className="w-6 h-6 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">GitHub</span>
                  <span className="text-[10px] text-muted-foreground">Sponsors</span>
                </a>
                <a
                  href={CONFIG.kofi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                >
                  <Coffee className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">Ko-fi</span>
                  <span className="text-[10px] text-muted-foreground">PayPal</span>
                </a>
                <a
                  href={CONFIG.razorpay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                >
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🇮🇳</span>
                  <span className="font-semibold text-sm">Razorpay</span>
                  <span className="text-[10px] text-muted-foreground">UPI/India</span>
                </a>
              </div>

              <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-border"
                />
                Don't show this again
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppFooter;
