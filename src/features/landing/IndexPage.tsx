import { Navbar } from "@/shared/components/Navbar";
import { Hero } from "@/shared/components/Hero";
import { Features } from "@/shared/components/Features";
import { ModeShowcase } from "@/shared/components/ModeShowcase";
import { ChatInterface } from "@/shared/components/ChatInterface";
import { Footer } from "@/shared/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <section id="features">
          <Features />
        </section>
        <section id="modes">
          <ModeShowcase />
        </section>
        <section id="chat">
          <ChatInterface />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
