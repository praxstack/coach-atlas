import { BookOpen, Code, MessageSquare, Target, Zap, Award } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Interview Coaching",
    description: "Master problem-solving through Socratic method with personalized guidance and pattern recognition.",
  },
  {
    icon: BookOpen,
    title: "Comprehensive Tutorials",
    description: "Beginner to advanced tutorials with visual aids, code examples, and interview-focused content.",
  },
  {
    icon: Code,
    title: "Production-Ready Code",
    description: "Learn real, runnable code that works in actual jobs—never pseudo-code or incomplete examples.",
  },
  {
    icon: Target,
    title: "System Design",
    description: "Structured framework for system design interviews with trade-off analysis and scale considerations.",
  },
  {
    icon: Zap,
    title: "Quick Solutions",
    description: "Get immediate answers when time is tight, with full explanations and common mistake warnings.",
  },
  {
    icon: Award,
    title: "Honest Feedback",
    description: "Brutally honest assessment of your skills with specific gaps and realistic improvement timelines.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Two Powerful Modes, <span className="text-gradient">One Mission</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Build problem solvers, not solution memorizers. Every feature is designed to make you job-ready.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
