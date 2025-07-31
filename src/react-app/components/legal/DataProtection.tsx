import React from 'react';

const DataProtection: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Protection</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Our Commitment to Data Protection</h2>
            <p className="text-gray-700 mb-4">
              At Kisigua, we are committed to protecting your personal data and respecting your privacy rights. 
              This document outlines our data protection practices in accordance with the General Data Protection 
              Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Data Controller Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700"><strong>Data Controller:</strong> Kisigua</p>
              <p className="text-gray-700"><strong>Address:</strong> Germany</p>
              <p className="text-gray-700"><strong>Email:</strong> privacy@kisigua.com</p>
              <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@kisigua.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">We process your personal data based on the following legal grounds:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Consent:</strong> When you have given explicit consent for specific processing activities</li>
              <li><strong>Contract:</strong> When processing is necessary for the performance of a contract</li>
              <li><strong>Legal Obligation:</strong> When we must comply with legal requirements</li>
              <li><strong>Legitimate Interest:</strong> When we have a legitimate business interest</li>
              <li><strong>Vital Interest:</strong> When processing is necessary to protect vital interests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Your Rights Under GDPR</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">4.1 Right to Information</h3>
            <p className="text-gray-700 mb-4">
              You have the right to be informed about how we collect and use your personal data.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">4.2 Right of Access</h3>
            <p className="text-gray-700 mb-4">
              You can request access to your personal data and receive a copy of the data we hold about you.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">4.3 Right to Rectification</h3>
            <p className="text-gray-700 mb-4">
              You can request correction of inaccurate or incomplete personal data.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">4.4 Right to Erasure</h3>
            <p className="text-gray-700 mb-4">
              You can request deletion of your personal data under certain circumstances.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">4.5 Right to Restrict Processing</h3>
            <p className="text-gray-700 mb-4">
              You can request limitation of how we process your personal data.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">4.6 Right to Data Portability</h3>
            <p className="text-gray-700 mb-4">
              You can request transfer of your data to another service provider.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">4.7 Right to Object</h3>
            <p className="text-gray-700 mb-4">
              You can object to processing of your personal data for direct marketing or legitimate interests.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. How to Exercise Your Rights</h2>
            <p className="text-gray-700 mb-4">
              To exercise any of your rights, please contact us using the information provided below. 
              We will respond to your request within one month.
            </p>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-blue-800 font-medium mb-2">📧 Email Request</p>
              <p className="text-blue-700">Send your request to: privacy@kisigua.com</p>
              <p className="text-blue-700">Include: Your full name, email address, and specific request</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Security Measures</h2>
            <p className="text-gray-700 mb-4">We implement comprehensive security measures to protect your data:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure data storage with access controls</li>
              <li>Regular security audits and penetration testing</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
              <li>Regular backup and recovery testing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention Periods</h2>
            <p className="text-gray-700 mb-4">We retain personal data for the following periods:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Account data:</strong> Until account deletion or 3 years of inactivity</li>
              <li><strong>Transaction records:</strong> 7 years for legal compliance</li>
              <li><strong>Marketing data:</strong> Until consent is withdrawn</li>
              <li><strong>Support tickets:</strong> 2 years after resolution</li>
              <li><strong>Analytics data:</strong> 26 months (anonymized)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              When we transfer your data outside the European Economic Area (EEA), we ensure adequate 
              protection through:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Adequacy decisions for certain countries</li>
              <li>Binding Corporate Rules where applicable</li>
              <li>Your explicit consent for specific transfers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Data Breach Notification</h2>
            <p className="text-gray-700 mb-4">
              In the event of a data breach that poses a high risk to your rights and freedoms, 
              we will notify you within 72 hours of becoming aware of the breach.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Complaints</h2>
            <p className="text-gray-700 mb-4">
              If you believe we have not handled your personal data properly, you have the right to 
              lodge a complaint with your local data protection authority.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>German Data Protection Authority:</strong></p>
              <p className="text-gray-700">Bundesbeauftragte für den Datenschutz und die Informationsfreiheit</p>
              <p className="text-gray-700">Website: www.bfdi.bund.de</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For any questions about data protection or to exercise your rights:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@kisigua.com</p>
              <p className="text-gray-700"><strong>Privacy Team:</strong> privacy@kisigua.com</p>
              <p className="text-gray-700"><strong>Response Time:</strong> Within 30 days</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DataProtection;
