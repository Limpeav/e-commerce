import { Truck, ShieldCheck, Smile, Clock } from "lucide-react";

const benefits = [
    {
        icon: Truck,
        title: "Free Shipping",
        description: "On all orders over $50"
    },
    {
        icon: ShieldCheck,
        title: "Safe & Non-Toxic",
        description: "Certified organic materials"
    },
    {
        icon: Smile,
        title: "Happiness Guaranteed",
        description: "30-day easy returns"
    },
    {
        icon: Clock,
        title: "24/7 Support",
        description: "We're here for you anytime"
    }
];

export default function BrandBenefits() {
    return (
        <div className="py-12 bg-white border-b border-stone-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {benefits.map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center space-y-3 group">
                            <div className="p-4 rounded-2xl bg-stone-50 text-primary group-hover:bg-primary-light/10 group-hover:text-primary-dark transition-colors duration-300">
                                <item.icon className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main font-display text-lg">{item.title}</h3>
                                <p className="text-sm text-text-muted font-medium">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
