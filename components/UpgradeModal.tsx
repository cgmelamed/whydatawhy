'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { logEvent } from '@/lib/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  remaining: number;
}

export default function UpgradeModal({ isOpen, onClose, remaining }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);

    // Log upgrade click event
    logEvent('upgrade_clicked', {
      remainingQueries: remaining
    });

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();

        // Log checkout started event
        logEvent('checkout_started', {
          plan: 'pro'
        });

        window.location.href = url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-gray-600" />

          <h2 className="font-medium text-2xl text-gray-900 mb-2">
            {remaining === 0 ? "You're out of free queries" : `${remaining} queries remaining`}
          </h2>

          <p className="text-gray-600 font-light mb-8">
            Upgrade to Pro for unlimited data analysis
          </p>

          <div className="border border-gray-200 rounded-xl p-6 mb-8">
            <div className="text-3xl font-light text-gray-900 mb-1">
              $5<span className="text-lg text-gray-500">/month</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 font-light">
              <li>✓ Unlimited queries</li>
              <li>✓ Priority processing</li>
              <li>✓ Advanced visualizations</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-black transition-all font-light tracking-wide disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Upgrade to Pro'}
          </button>

          <p className="mt-4 text-xs text-gray-400">
            Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}