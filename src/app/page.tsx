import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ReliefOverview from "@/components/ReliefOverview";
import Privacy from "@/components/Privacy";
import FreeForever from "@/components/FreeForever";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <ReliefOverview />
        <Privacy />
        <FreeForever />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
