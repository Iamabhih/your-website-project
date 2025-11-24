import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Benefits from "@/components/Benefits";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { Banner } from "@/components/Banner";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Banner />
      <Header />
      <Hero />
      <Products />
      <Benefits />
      <About />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
