'use client';

import { useState, useEffect } from 'react';
import { EstimatorInput, EstimatorResult } from '@/types/estimator';
import ResultsDisplay from './ResultsDisplay';

const inputClass =
  'w-full px-4 py-3 bg-white border-2 border-sand-200 rounded-md font-sans text-body-text' +
  ' focus:outline-none focus:border-green-light focus:ring-2 focus:ring-green-light/30 transition-all';

const labelClass = 'block font-heading text-xs font-bold text-blue-dark mb-2';

export default function EstimatorForm() {
  const [formData, setFormData] = useState<EstimatorInput>({
    cmz_code: '',
    battery_kwh: 0,
    inverter_kw: 0,
    solar_kw: 0,
    ev_kw: 0,
    heat_pump_kw: 0,
  });

  const [result, setResult] = useState<EstimatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('revealed')),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cmz_code' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to calculate earnings');
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Section heading */}
      <div data-reveal="up">
        <h2 className="font-heading text-5xl font-extrabold text-green-light mb-2">
          CALCULATE EARNINGS
        </h2>
        <div className="w-20 h-1 bg-blue-dark rounded" />
        <p className="mt-4 font-sans text-body-text text-lg">
          Enter your energy asset specifications to calculate potential earnings.
        </p>
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl border-t-4 border-blue-dark p-8 space-y-8"
        data-reveal="scale"
      >
        {/* CMZ Code — required */}
        <div>
          <label htmlFor="cmz_code" className={labelClass}>
            CMZ CODE <span className="text-peach">*</span>
          </label>
          <input
            type="text"
            id="cmz_code"
            name="cmz_code"
            value={formData.cmz_code}
            onChange={handleChange}
            required
            placeholder="e.g. CMZ_T10A_EM_0097"
            className={inputClass}
          />
        </div>

        {/* Asset inputs grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div data-reveal="left">
            <label htmlFor="battery_kwh" className={labelClass}>BATTERY CAPACITY (kWh)</label>
            <input type="number" id="battery_kwh" name="battery_kwh"
              value={formData.battery_kwh} onChange={handleChange}
              min="0" step="0.1" placeholder="0.0" className={inputClass} />
          </div>

          <div data-reveal="right">
            <label htmlFor="inverter_kw" className={labelClass}>INVERTER CAPACITY (kW)</label>
            <input type="number" id="inverter_kw" name="inverter_kw"
              value={formData.inverter_kw} onChange={handleChange}
              min="0" step="0.1" placeholder="0.0" className={inputClass} />
          </div>

          <div data-reveal="left">
            <label htmlFor="solar_kw" className={labelClass}>SOLAR CAPACITY (kW)</label>
            <input type="number" id="solar_kw" name="solar_kw"
              value={formData.solar_kw} onChange={handleChange}
              min="0" step="0.1" placeholder="0.0" className={inputClass} />
          </div>

          <div data-reveal="right">
            <label htmlFor="ev_kw" className={labelClass}>EV CHARGER CAPACITY (kW)</label>
            <input type="number" id="ev_kw" name="ev_kw"
              value={formData.ev_kw} onChange={handleChange}
              min="0" step="0.1" placeholder="0.0" className={inputClass} />
          </div>

          <div data-reveal="left" className="md:col-span-2">
            <label htmlFor="heat_pump_kw" className={labelClass}>HEAT PUMP CAPACITY (kW)</label>
            <input type="number" id="heat_pump_kw" name="heat_pump_kw"
              value={formData.heat_pump_kw} onChange={handleChange}
              min="0" step="0.1" placeholder="0.0" className={inputClass} />
          </div>
        </div>

        {/* CTA button — gold accent */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-500 text-blue-dark font-heading font-extrabold py-4 px-8 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gold/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'CALCULATING...' : 'CALCULATE EARNINGS'}
        </button>

        {error && (
          <div className="border-l-4 border-peach bg-peach/10 text-body-text px-5 py-4 rounded-md font-sans">
            <strong className="font-heading text-sm text-blue-dark">Error:</strong> {error}
          </div>
        )}
      </form>

      {result && <ResultsDisplay result={result} />}
    </div>
  );
}
