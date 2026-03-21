import { Shield, Lock, Eye, Database } from 'lucide-react';

// UI Components
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import ContentBox from '../../components/ui/ContentBox';
import FeatureList from '../../components/ui/FeatureList';

export default function Privacy() {
  return (
    <PageLayout 
      title="Privacy Policy"
      subtitle="Identity Protection & Data Sovereignty"
      badge={`Last Updated: ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`}
      icon={Shield}
      badgeColor="green"
    >
      <div className="space-y-16">
        {/* Information We Collect */}
        <section>
          <SectionHeader number={1} title="Information We Collect" icon={Database} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ContentBox>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">Personal Data</h3>
              <FeatureList 
                items={['Name & Contact Details', 'Email Address', 'Shipping Address', 'Payment Information']}
                itemClass="text-sm font-medium text-text-muted"
              />
            </ContentBox>
            <ContentBox>
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Technical Metadata</h3>
              <FeatureList 
                items={['Network IP Signature', 'Terminal Fingerprinting', 'Navigation Logs', 'Temporal Analytics']}
                itemClass="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest leading-none"
                customBullet="w-1.5 h-1.5 bg-secondary rounded-full"
              />
            </ContentBox>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section>
          <SectionHeader number={2} title="Operational Logic" icon={Eye} />
          <ContentBox className="rounded-[3rem] p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {[
                { label: 'Order Execution', desc: 'Secure fulfillment of acquisitions' },
                { label: 'Client Uplink', desc: 'Assistance via support channels' },
                { label: 'Experience Tuning', desc: 'Neural personalization of content' },
                { label: 'Status Updates', desc: 'Real-time telemetry reports' },
                { label: 'Vault Security', desc: 'Fraud detection and prevention' },
                { label: 'Metric Analysis', desc: 'System optimization protocols' }
              ].map((item) => (
                <div key={item.label} className="group cursor-default">
                  <p className="text-[10px] font-black text-text-main uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest opacity-60 leading-none">{item.desc}</p>
                </div>
              ))}
            </div>
          </ContentBox>
        </section>

        {/* Data Protection */}
        <section>
          <SectionHeader number={3} title="Encryption Tiers" icon={Lock} />
          <ContentBox className="rounded-[3rem] p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Security Measures</h3>
                <FeatureList 
                  items={['RSA-4096 Encryption', 'Secure Token Gateway', 'Biweekly Security Audits', 'Zero-Access Storage']}
                  itemClass="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest leading-none"
                  customBullet="w-5 h-px bg-stone-300"
                />
              </div>
              <div className="flex flex-col justify-center border-l border-stone-200 pl-10 md:border-l lg:pl-10">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Retention Policy</h3>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">
                  Data persistence is limited to operational necessity and legal mandates. Post-cycle, all non-essential identifiers undergo irreversible deletion protocols.
                </p>
              </div>
            </div>
          </ContentBox>
        </section>

        {/* Rights & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-[3rem] p-10 border-2 border-stone-50 shadow-sm">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8">Sovereignty Rights</h2>
            <div className="flex flex-wrap gap-2 text-[8px] font-black text-text-muted">
              {['Access', 'Rectification', 'Erasure', 'Portability', 'Restriction'].map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-stone-100 rounded-full uppercase tracking-widest">{tag}</span>
              ))}
            </div>
          </section>

          <section className="bg-text-main rounded-[3rem] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 relative z-10">Communications</h2>
            <div className="space-y-2 relative z-10">
              <p className="text-sm font-black font-display tracking-widest">ENCRYPTION@APPLAC.NET</p>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em]">SECURE CHANNEL 01</p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
