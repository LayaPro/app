import { Hero } from './components/Hero/Hero';
import { About } from './components/About/About';
import { Portfolio } from './components/Portfolio/Portfolio';
import { Quote } from './components/Quote/Quote';
import { Footer } from './components/Footer/Footer';

function App() {
  return (
    <main>
      <Hero />
      <About />
      <Portfolio />
      <Quote />
      <Footer />
    </main>
  );
}

export default App;
