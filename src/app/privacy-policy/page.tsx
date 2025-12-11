'use client';

import { useState, useEffect } from 'react';
import { legalDocumentGenerator } from '@/lib/legal-document-generator';
import { getSupportedLegalRegions } from '@/lib/legal-compliance';

export default function PrivacyPolicyPage() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('EU');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [loading, setLoading] = useState(true);

  const supportedRegions = getSupportedLegalRegions();
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'ru', name: 'Русский' },
    { code: 'nl', name: 'Nederlands' }
  ];

  useEffect(() => {
    generatePrivacyPolicy();
  }, [selectedJurisdiction, selectedLanguage]);

  const generatePrivacyPolicy = () => {
    setLoading(true);
    try {
      const policy = legalDocumentGenerator.generatePrivacyPolicy(
        selectedJurisdiction,
        selectedLanguage,
        {
          includeDataProcessing: true,
          includeCookiePolicy: true,
          includeAgeRestrictions: true,
          includeThirdPartyServices: true,
          includeInternationalTransfers: true
        }
      );
      setPrivacyPolicy(policy);
    } catch (error) {
      console.error('Error generating privacy policy:', error);
      setPrivacyPolicy('Error generating privacy policy. Please try again.');
    }
    setLoading(false);
  };

  const formatPolicy = (policy: string) => {
    return policy.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mb-6 text-gray-900">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold mb-4 mt-8 text-gray-800">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium mb-3 mt-6 text-gray-700">{line.substring(4)}</h3>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold mb-2 text-gray-900">{line.substring(2, line.length - 2)}</p>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="mb-1 ml-4 text-gray-700">{line.substring(2)}</li>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-3 text-gray-700 leading-relaxed">{line}</p>;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-6">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our energy drink calculator and recipe guidance service.
          </p>
          
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jurisdiction
              </label>
              <select
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {supportedRegions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Generating privacy policy...</span>
            </div>
          ) : (
            <div className="prose max-w-none">
              {formatPolicy(privacyPolicy)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Contact Information</h3>
          <p className="text-blue-800 mb-2">
            For privacy questions or to exercise your rights, contact us at:
          </p>
          <div className="text-blue-700">
            <p><strong>Email:</strong> privacy@energydrinkguide.com</p>
            <p><strong>Data Protection Officer:</strong> dpo@energydrinkguide.com</p>
            <p><strong>Address:</strong> [Company Address]</p>
          </div>
          <p className="text-blue-700 mt-4 text-sm">
            We will respond to your request within 30 days as required by applicable privacy laws.
          </p>
        </div>
      </div>
    </div>
  );
}