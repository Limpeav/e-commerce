import React from "react";
import { MapPin, Globe, Navigation, Clock, Phone, Mail, Box } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import SectionHeader from "../../components/ui/SectionHeader";
import ContentBox from "../../components/ui/ContentBox";
import { useLanguage } from "../../context/useLanguage";

export default function Location() {
    const { t } = useLanguage();
    const offices = [
        {
            city: "San Francisco",
            type: t("location.globalHeadquarters"),
            address: "1234 Tech Plaza, Silicon District, CA 94103",
            phone: "+1 (555) 001-9988",
            status: t("location.operational"),
            statusType: "operational",
            isHQ: true
        },
        {
            city: "London",
            type: t("location.europeanHub"),
            address: "88 Innovation Way, Canary Wharf, E14 5AB",
            phone: "+44 20 7946 0123",
            status: t("location.standby"),
            statusType: "standby",
            isHQ: false
        }
    ];

    return (
        <PageLayout
            title={t("location.title")}
            subtitle={t("location.subtitle")}
            badge={t("location.badge")}
            icon={MapPin}
            badgeColor="blue"
            maxWidth="7xl"
        >
            <div className="space-y-24">
                {/* Main Map Visual Placeholder */}
                <section>
                    <div className="aspect-[21/9] bg-stone-100 rounded-[4rem] relative overflow-hidden group border border-stone-200">
                        <div className="absolute inset-0 opacity-40 mix-blend-multiply transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: 'url("https://api.placeholder.com/1200/600")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-text-main/40 to-transparent"></div>

                        {/* Animated Pingers */}
                        <div className="absolute top-1/4 left-1/4">
                            <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                            <div className="w-4 h-4 bg-primary rounded-full absolute top-0"></div>
                        </div>
                        <div className="absolute top-1/3 right-1/3">
                            <div className="w-4 h-4 bg-secondary rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                            <div className="w-4 h-4 bg-secondary rounded-full absolute top-0"></div>
                        </div>

                        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] opacity-80">{t("location.syncStatus")}</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-xl font-bold text-white font-display tracking-widest">{t("location.globalNetworkActive")}</p>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                                <p className="text-[8px] font-black text-white uppercase tracking-widest">{t("location.activeHubs")}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Hub Listings */}
                <section>
                    <SectionHeader number={1} title={t("location.primaryEntities")} icon={Box} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {offices.map((office, idx) => (
                            <ContentBox key={idx} className={`relative overflow-hidden group ${office.isHQ ? 'border-primary/20 bg-primary/5' : ''}`}>
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h3 className="text-3xl font-bold text-text-main font-display mb-1">{office.city}</h3>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{office.type}</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${office.statusType === 'operational' ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-500'}`}>
                                        {office.status}
                                    </div>
                                </div>

                                <div className="space-y-6 mb-12">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-4 h-4 text-text-muted mt-1" />
                                        <p className="text-xs font-semibold text-text-muted leading-relaxed uppercase tracking-widest">{office.address}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Phone className="w-4 h-4 text-text-muted" />
                                        <p className="text-xs font-bold text-text-main tracking-widest">{office.phone}</p>
                                    </div>
                                </div>

                                <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-stone-200 text-[10px] font-black text-text-main uppercase tracking-widest hover:bg-text-main hover:text-white transition-all group/btn shadow-sm">
                                    <Navigation className="w-3 h-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    {t("location.requestDirections")}
                                </button>
                            </ContentBox>
                        ))}
                    </div>
                </section>

                {/* Distributed Support */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ContentBox className="lg:col-span-2 flex flex-col md:flex-row gap-12 items-center">
                        <div className="w-24 h-24 bg-stone-50 rounded-3xl flex items-center justify-center shrink-0 shadow-sm border border-stone-100">
                            <Globe className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-4 text-center md:text-left">
                            <h4 className="text-xl font-black text-text-main font-display tracking-tight">{t("location.worldwideFulfillment")}</h4>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed max-w-lg">
                                {t("location.fulfillmentText")}
                            </p>
                        </div>
                    </ContentBox>

                    <div className="bg-text-main rounded-[3rem] p-10 text-white flex flex-col justify-center relative overflow-hidden group shadow-2xl shadow-text-main/20">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary opacity-20 rounded-full -mb-16 -mr-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 relative z-10">{t("location.uplinkDirectly")}</h4>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-white/40" />
                                <span className="text-xs font-bold tracking-widest">LOGISTICS@APPLAC.NET</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-white/40" />
                                <span className="text-xs font-bold tracking-widest">HQ.APPLAC.NET</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
