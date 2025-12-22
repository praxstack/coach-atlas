import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { ModeShowcase } from "@/components/ModeShowcase";
import { ChatInterface } from "@/components/ChatInterface";
import { Footer } from "@/components/Footer";

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
