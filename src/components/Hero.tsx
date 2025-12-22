import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Code2, Sparkles } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Your AI Technical Mentor</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Master Tech Interviews with{" "}
            <span className="text-gradient">Coach Atlas</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            World-class interview preparation and comprehensive tutorials through guided discovery and brutally honest feedback.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" className="group">
              Start Learning
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="heroOutline" size="xl">
              View Tutorials
            </Button>
          </div>
          
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm">Guided Discovery</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm">Real Code Examples</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm">Honest Feedback</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
