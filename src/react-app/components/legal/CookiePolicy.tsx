import React from 'react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">2.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are necessary for the website to function properly. They enable core functionality 
              such as security, network management, and accessibility.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">2.2 Performance Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies collect information about how visitors use our website, such as which pages are 
              visited most often. This data helps us improve our website performance.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">2.3 Functional Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies allow the website to remember choices you make and provide enhanced, more 
              personal features such as language preferences and location settings.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">2.4 Targeting Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are used to deliver advertisements more relevant to you and your interests. 
              They may be set by us or by third-party providers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Cookies</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Authenticate users and prevent fraudulent use of accounts</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Improve our services and user experience</li>
              <li>Provide personalized content and recommendations</li>
              <li>Enable social media features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We may use third-party services that set cookies on our behalf. These include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Google Analytics for website analytics</li>
              <li>Social media platforms for sharing features</li>
              <li>Payment processors for secure transactions</li>
              <li>Content delivery networks for improved performance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in several ways:
            </p>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">5.1 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Block all cookies</li>
              <li>Block third-party cookies</li>
              <li>Delete cookies when you close your browser</li>
              <li>Set exceptions for specific websites</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-3">5.2 Cookie Consent</h3>
            <p className="text-gray-700 mb-4">
              When you first visit our website, we will ask for your consent to use non-essential cookies. 
              You can change your preferences at any time through our cookie consent banner.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookie Retention</h2>
            <p className="text-gray-700 mb-4">
              Cookies are stored for different periods depending on their purpose:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent cookies:</strong> Stored for a specific period (up to 2 years)</li>
              <li><strong>Authentication cookies:</strong> Deleted when you log out</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Impact of Disabling Cookies</h2>
            <p className="text-gray-700 mb-4">
              If you disable cookies, some features of our website may not function properly:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You may need to log in repeatedly</li>
              <li>Your preferences may not be saved</li>
              <li>Some personalized features may not work</li>
              <li>Website performance may be affected</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time to reflect changes in our practices or 
              for other operational, legal, or regulatory reasons. Please check this page periodically 
              for updates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> privacy@kisigua.com</p>
              <p className="text-gray-700"><strong>Subject:</strong> Cookie Policy Inquiry</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
