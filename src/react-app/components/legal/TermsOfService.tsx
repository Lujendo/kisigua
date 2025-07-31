import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Kisigua ("the Platform"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use 
              this service.
            </p>
            <p className="text-gray-700">
              These Terms of Service ("Terms") govern your use of our platform and services provided by 
              Kisigua ("we," "us," or "our").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Kisigua is a platform that connects users with sustainable local producers and eco-friendly 
              resources. Our services include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Location-based search for sustainable businesses and resources</li>
              <li>User accounts and profiles</li>
              <li>Listing creation and management</li>
              <li>Communication tools between users and providers</li>
              <li>Premium subscription services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To use certain features of our platform, you must create an account. You agree to provide 
              accurate, current, and complete information during registration and to update such information 
              to keep it accurate, current, and complete.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">3.2 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for safeguarding your account credentials and for all activities that 
              occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">3.3 Account Termination</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account at any time for violations of these 
              Terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Use the platform for any unlawful purpose or in violation of any applicable laws</li>
              <li>Post false, misleading, or fraudulent information</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Spam or send unsolicited communications</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the platform</li>
              <li>Violate any intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Content and Listings</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">5.1 User Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you post on our platform. By posting content, you grant us 
              a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content 
              in connection with our services.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">5.2 Content Standards</h3>
            <p className="text-gray-700 mb-4">
              All content must be accurate, lawful, and not infringe on third-party rights. We reserve the 
              right to remove content that violates these standards.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-3">5.3 Listing Accuracy</h3>
            <p className="text-gray-700">
              Users who create listings are responsible for ensuring all information is accurate, current, 
              and complete. Misleading or false listings may result in account suspension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Premium Services</h2>
            <p className="text-gray-700 mb-4">
              We offer premium subscription services with additional features. Premium services are subject 
              to additional terms and payment obligations.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Subscription fees are charged in advance</li>
              <li>Cancellation policies apply as described in your subscription agreement</li>
              <li>Premium features are subject to availability</li>
              <li>Refunds are provided according to our refund policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacy</h2>
            <p className="text-gray-700">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your 
              use of the platform, to understand our practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The platform and its original content, features, and functionality are owned by Kisigua and 
              are protected by international copyright, trademark, patent, trade secret, and other 
              intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
            <p className="text-gray-700 mb-4">
              The platform is provided "as is" and "as available" without warranties of any kind. We do not 
              guarantee the accuracy, completeness, or reliability of any content or listings.
            </p>
            <p className="text-gray-700">
              We are not responsible for transactions between users or the quality of goods and services 
              offered through our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, Kisigua shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of Germany, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify users of any material 
              changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> legal@kisigua.com</p>
              <p className="text-gray-700"><strong>Address:</strong> Kisigua Legal Department</p>
              <p className="text-gray-700">Germany</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
