import { Brain, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

export const ModeShowcase = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interview Coach Mode */}
          <div className="group relative p-8 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Mode 1</span>
                  <h3 className="text-2xl font-bold">Interview Coach</h3>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Master problem-solving through guided discovery. Get honest feedback, pattern recognition, and escalating hints that build real understanding.
              </p>
              
              <div className="space-y-3 mb-6">
                {[
                  "Socratic method for deep learning",
                  "Pattern-based problem solving",
                  "Honest skill assessment",
                  "Mock interview practice",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
              {/* Code preview */}
              <div className="code-block text-xs">
                <div className="text-muted-foreground mb-2"># Guided Discovery Flow</div>
                <div><span className="text-primary">1.</span> "What's your approach?"</div>
                <div><span className="text-primary">2.</span> "Why that approach?"</div>
                <div><span className="text-primary">3.</span> "What edge cases?"</div>
                <div><span className="text-primary">4.</span> "What's the complexity?"</div>
              </div>
            </div>
          </div>
          
          {/* Tutorial Creator Mode */}
          <div className="group relative p-8 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Mode 2</span>
                  <h3 className="text-2xl font-bold">Tutorial Creator</h3>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Generate comprehensive, beginner-to-advanced tutorials with visual aids, production-ready code, and interview preparation built in.
              </p>
              
              <div className="space-y-3 mb-6">
                {[
                  "Progressive complexity levels",
                  "Visual diagrams & examples",
                  "Production-ready code",
                  "Interview questions included",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
              {/* Tutorial preview */}
              <div className="code-block text-xs">
                <div className="text-primary mb-2"># Tutorial Structure</div>
                <div className="text-muted-foreground">→ Foundation (Beginner)</div>
                <div className="text-muted-foreground">→ Core Concepts (Progressive)</div>
                <div className="text-muted-foreground">→ Visual Learning</div>
                <div className="text-muted-foreground">→ Interview Prep</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="glow" size="lg" className="group">
            Choose Your Path
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};
