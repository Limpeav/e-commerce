import { FileText, AlertCircle, Users, Package } from 'lucide-react';

// UI Components
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import ContentBox from '../../components/ui/ContentBox';
import FeatureList from '../../components/ui/FeatureList';

export default function Terms() {
  return (
    <PageLayout 
      title="Terms of Service"
      subtitle="Operational Framework & Ethical Guidelines"
      badge={`Version 2.4 // ${new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}
      icon={FileText}
    >
      <div className="space-y-16">
        {/* Acceptance of Terms */}
        <section>
          <SectionHeader number={1} title="Acceptance of Terms" />
          <ContentBox>
            <p className="text-sm font-medium text-text-muted leading-relaxed">
              By accessing and using Applac, you accept and agree to be bound by these Terms of Service
              and our Privacy Policy. If you do not agree to these terms, please do not use our services.
            </p>
          </ContentBox>
        </section>

        {/* Products and Services */}
        <section>
          <SectionHeader number={2} title="Products & Services" />
          <ContentBox className="rounded-[3rem] p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Registry Information</h3>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">
                  We strive for absolute accuracy in data logs, pricing, and availability.
                  However, we maintain a disclaimer for potential telemetry discrepancies or system errors.
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Availability Balance</h3>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed text-right md:text-left">
                  Prices oscillate based on market equilibrium. We reserve the right to
                  recalibrate or phase out assets without liability.
                </p>
              </div>
            </div>
          </ContentBox>
        </section>

        {/* User Accounts */}
        <section>
          <SectionHeader number={3} title="Node Responsibility" titleClass="text-xl font-black text-text-main font-display uppercase tracking-widest" />
          <ContentBox className="rounded-[3rem] p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Protocol Requirements</h3>
                <FeatureList 
                  items={[
                    'Data Integrity is mandatory',
                    'Passkey Maintenance is private',
                    'Full agency for account activities',
                    'Immediate breach reporting',
                    'Maturity index 18+ requirement'
                  ]}
                />
              </div>
              <div className="flex flex-col justify-center border-l border-stone-200 pl-10">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Neutralization Clause</h3>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">
                  We maintain the right to suspend or terminate node access for protocols violation or
                  unauthorized activity without prior warning.
                </p>
              </div>
            </div>
          </ContentBox>
        </section>

        {/* Orders and Payment */}
        <section>
          <SectionHeader number={4} title="Transaction Flow" titleClass="text-xl font-black text-text-main font-display uppercase tracking-widest" />
          <ContentBox>
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Confirmation Protocol</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-[2]">
                  Electronic receipts are not final acceptance. Order finalization occurs post-validation.
                  We maintain universal right of refusal for any reason.
                </p>
              </div>
              <div className="pt-8 border-t border-stone-200">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Currency Logic</h3>
                <div className="flex flex-wrap gap-x-12 gap-y-4">
                  {['PRE-PROCESS PAYMENT', 'STORM BASE: USD', 'MANDATORY TAX CODES', 'ENCRYPTED CHANNELS'].map(stat => (
                    <p key={stat} className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">{stat}</p>
                  ))}
                </div>
              </div>
            </div>
          </ContentBox>
        </section>

        {/* Shipping and Returns */}
        <section>
          <SectionHeader number={5} title="Logistic Transit" titleClass="text-xl font-black text-text-main font-display uppercase tracking-widest" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ContentBox className="rounded-[2.5rem] p-10">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Delivery cycles</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Standard Transit</span>
                  <span className="text-[10px] font-black text-stone-400">3-5 CYCLES</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Express Uplink</span>
                  <span className="text-[10px] font-black text-stone-400">1-2 CYCLES</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Global Link</span>
                  <span className="text-[10px] font-black text-stone-400">SUPPORTED</span>
                </div>
              </div>
            </ContentBox>
            <ContentBox className="rounded-[2.5rem] p-10">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Reclamation Policy</h3>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-[2]">
                Items must remain in original synchronization (packaging). All reclamation
                requests must initiate within 30 solar cycles post-delivery.
              </p>
            </ContentBox>
          </div>
        </section>

        {/* Intellectual Property */}
        <section>
          <SectionHeader number={6} title="Proprietary Rights" titleClass="text-xl font-black text-text-main font-display uppercase tracking-widest" />
          <ContentBox className="rounded-[3rem] p-10 text-center">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-[2.5] max-w-2xl mx-auto">
              All digital constructs, branding, visual algorithms, and textual data are protected proprietary assets of the Applac collective.
              Unauthorized duplication, reverse engineering, or redistribution is strictly prohibited and monitored.
            </p>
          </ContentBox>
        </section>

        {/* Limitation & Liability */}
        <section className="bg-red-50 rounded-[3rem] p-10 border border-red-100">
          <div className="flex items-center gap-4 mb-8">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-black text-red-900 font-display uppercase tracking-widest">Liability Ceiling</h2>
          </div>
          <p className="text-[10px] font-black text-red-800 uppercase tracking-widest leading-relaxed">
            Applac maintains zero liability for consequential system anomalies or indirect data fluctuations. Total agency is capped at the acquisition cost of the specific asset involved in the dispute.
          </p>
        </section>

        {/* Legal Link */}
        <section className="bg-text-main rounded-[4rem] p-12 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="max-w-xl relative z-10">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-8">Legal Terminal</h2>
            <p className="text-2xl font-black font-display mb-8 uppercase tracking-tight">Direct inquiry line for arbitration & policy disputes.</p>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">LEGAL.HUB@APPLAC.NET</p>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">GLOBAL JURISDICTION 01</p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
