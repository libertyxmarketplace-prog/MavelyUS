import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { getBotInviteUrl } from '@/lib/api';

// Types
export interface Feature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Feature[];
  popular?: boolean;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface PricingComponentProps {
  plans?: PricingPlan[];
  onPlanSelect?: (planId: string, billingCycle: 'monthly' | 'annual') => void;
  defaultBillingCycle?: 'monthly' | 'annual';
  currency?: string;
  annualDiscount?: number;
  className?: string;
  showComparison?: boolean;
}

// Default plans tailored for Mavely ER:LC Communities
export const defaultPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Community Starter',
    description: 'Essential operations for launching new ER:LC private servers',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { name: '1 ER:LC Private Server key', included: true },
      { name: '5 Customizable ticket categories', included: true },
      { name: 'Basic PRC live player count radar', included: true },
      { name: 'Discord OAuth2 web dashboard', included: true },
      { name: 'Staff quiz applications', included: false },
      { name: 'Radio VC frequency sync', included: false },
      { name: 'Custom bot token & whitelabel', included: false }
    ],
    buttonText: 'Add to Server'
  },
  {
    id: 'professional',
    name: 'Operations Pro',
    description: 'Complete operational automation for active roleplay communities',
    monthlyPrice: 15,
    annualPrice: 12,
    features: [
      { name: 'Up to 3 ER:LC Private Server keys', included: true },
      { name: 'Unlimited support ticket categories & transcripts', included: true },
      { name: 'Live PRC server radar & queue tracker', included: true },
      { name: 'Shift logs, LOA manager & staff quota', included: true },
      { name: 'Interactive staff application review channels', included: true },
      { name: 'In-game radio frequency voice sync', included: true },
      { name: 'Custom bot token & whitelabel', included: false }
    ],
    popular: true,
    buttonText: 'Upgrade to Pro'
  },
  {
    id: 'enterprise',
    name: 'Network Whitelabel',
    description: 'Dedicated custom bot runtime with full branding & multi-server support',
    monthlyPrice: 35,
    annualPrice: 28,
    features: [
      { name: 'Unlimited ER:LC Private Servers', included: true },
      { name: 'Your server’s own custom bot name & avatar', included: true },
      { name: 'Dedicated private bot process & token', included: true },
      { name: 'Custom moderation lineage & interview stages', included: true },
      { name: 'Full Webhook & REST API integration', included: true },
      { name: '24/7 Priority Discord developer support', included: true },
      { name: 'Automated database backups & zero downtime', included: true }
    ],
    buttonText: 'Deploy Whitelabel',
    buttonVariant: 'outline'
  }
];

export const PricingComponent: React.FC<PricingComponentProps> = ({
  plans = defaultPlans,
  onPlanSelect,
  defaultBillingCycle = 'monthly',
  currency = '$',
  annualDiscount = 20,
  className = '',
  showComparison = true
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(defaultBillingCycle);
  const [activeTab, setActiveTab] = useState<'pricing' | 'comparison'>('pricing');

  const handlePlanSelect = (planId: string) => {
    if (onPlanSelect) {
      onPlanSelect(planId, billingCycle);
    } else {
      window.location.href = getBotInviteUrl();
    }
  };

  const handleBillingToggle = (isAnnual: boolean) => {
    setBillingCycle(isAnnual ? 'annual' : 'monthly');
  };

  const formatPrice = (plan: PricingPlan) => {
    const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    if (price === 0) return 'Free';
    return `${currency}${price}`;
  };

  const getAnnualSavings = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 0;
    const monthlyCost = plan.monthlyPrice * 12;
    const annualCost = plan.annualPrice * 12;
    const savings = Math.round(((monthlyCost - annualCost) / monthlyCost) * 100);
    return savings;
  };

  // Get all unique features for comparison table
  const allFeatures = React.useMemo(() => {
    const featureSet = new Set<string>();
    plans.forEach(plan => {
      plan.features.forEach(feature => featureSet.add(feature.name));
    });
    return Array.from(featureSet);
  }, [plans]);

  const PricingCards = () => (
    <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto pt-4">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`relative transition-all duration-300 rounded-2xl bg-[#11131a]/90 backdrop-blur-md border ${
            plan.popular 
              ? 'border-[#2ecc71]/40 shadow-2xl shadow-[#2ecc71]/10 scale-[1.02] lg:scale-105' 
              : 'border-white/[0.08] hover:border-white/20 hover:bg-[#13151f]'
          } ${className}`}
        >
          {plan.popular && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-[#2ecc71] hover:bg-[#2ecc71] text-black font-semibold px-3 py-0.5 text-xs tracking-wide shadow-md">
                Most Popular
              </Badge>
            </div>
          )}
          
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-xl font-bold text-white tracking-tight">{plan.name}</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-zinc-400 min-h-[38px] leading-relaxed">
              {plan.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-6">
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
                  {formatPrice(plan)}
                </span>
                {formatPrice(plan) !== 'Free' && (
                  <span className="text-xs text-zinc-400">
                    /{billingCycle === 'annual' ? 'mo' : 'month'}
                  </span>
                )}
              </div>
              {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                <div className="text-xs text-[#2ecc71] font-medium mt-1">
                  Billed annually • Save {getAnnualSavings(plan)}%
                </div>
              )}
            </div>

            <ul className="space-y-3 pt-2 border-t border-white/[0.06]">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 shrink-0 ${feature.included ? 'text-[#2ecc71]' : 'text-zinc-600'}`}>
                    {feature.included ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      <X className="size-4" aria-hidden="true" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm leading-snug ${feature.included ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              onClick={() => handlePlanSelect(plan.id)}
              className={`w-full transition-all duration-200 font-semibold rounded-xl text-xs sm:text-sm h-11 ${
                plan.popular
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-black hover:opacity-95 shadow-lg shadow-[#2ecc71]/15'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
              }`}
            >
              {plan.buttonText || 'Get Started'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const ComparisonTable = () => (
    <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-[#11131a]/80 backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              <th className="text-left py-4 px-6 text-xs sm:text-sm font-semibold text-zinc-300">Feature</th>
              {plans.map((plan) => (
                <th key={plan.id} className="text-center py-4 px-4 min-w-[140px]">
                  <div className="space-y-1">
                    <div className="font-semibold text-xs sm:text-sm text-white">{plan.name}</div>
                    <div className="text-xl font-bold text-white font-display">{formatPrice(plan)}</div>
                    {formatPrice(plan) !== 'Free' && (
                      <div className="text-[10px] text-zinc-500">
                        /{billingCycle === 'annual' ? 'mo' : 'month'}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((featureName) => (
              <tr key={featureName} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-6 text-xs sm:text-sm font-medium text-zinc-300">{featureName}</td>
                {plans.map((plan) => {
                  const feature = plan.features.find(f => f.name === featureName);
                  return (
                    <td key={`${plan.id}-${featureName}`} className="text-center py-3.5 px-4">
                      {feature?.included ? (
                        <Check className="size-4 text-[#2ecc71] mx-auto" aria-label="Included" />
                      ) : (
                        <X className="size-4 text-zinc-600 mx-auto" aria-label="Not included" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-white ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 border-white/10 bg-white/[0.04] text-zinc-300 px-3 py-1 text-xs">
            Flexible Community Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display mb-3">
            Choose Your Plan
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-7 leading-relaxed">
            Scalable plans for Emergency Response: Liberty County servers of all sizes. No hidden fees. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-xs sm:text-sm font-medium transition-colors ${
              billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'
            }`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'annual'}
              onCheckedChange={handleBillingToggle}
              aria-label="Toggle billing cycle"
            />
            <span className={`text-xs sm:text-sm font-medium transition-colors ${
              billingCycle === 'annual' ? 'text-white' : 'text-zinc-500'
            }`}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <Badge variant="secondary" className="ml-1 text-[11px] text-[#2ecc71] bg-[#2ecc71]/10 border-[#2ecc71]/30">
                Save up to {annualDiscount}%
              </Badge>
            )}
          </div>

          {/* Tab Navigation */}
          {showComparison && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'pricing'
                      ? 'bg-white/[0.1] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Plans
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'comparison'
                      ? 'bg-white/[0.1] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Compare All Features
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!showComparison || activeTab === 'pricing' ? (
          <PricingCards />
        ) : (
          <ComparisonTable />
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-zinc-500">
            All plans include community Discord support. Upgrade or downgrade directly from your server dashboard at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingComponent;
