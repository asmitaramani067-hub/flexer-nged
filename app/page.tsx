import EstimatorForm from '@/components/EstimatorForm';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e9' }}>
      <Header />

      {/* Hero */}
      <section className="bg-blue-dark py-20 px-4">
        <div className="max-w-5xl mx-auto text-center" data-reveal="up">
          <h1 className="font-heading text-6xl md:text-7xl font-extrabold text-white mb-6">
            <span className="text-green-light">EARNING ESTIMATOR</span>
          </h1>
          <p className="text-xl text-sand-200 max-w-2xl mx-auto leading-relaxed font-sans">
            Estimate your potential earnings from energy assets in NGED CMZ zones.
            Enter your hardware specs below to see how much you could earn.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <EstimatorForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-dark py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sand-300 text-sm font-sans">
            © {new Date().getFullYear()} NGED CMZ Earning Estimator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
