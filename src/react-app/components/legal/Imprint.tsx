import React from 'react';

const Imprint: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Imprint / Impressum</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            Information in accordance with § 5 TMG (German Telemedia Act)
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Company Name:</strong> Kisigua</p>
              <p className="text-gray-700 mb-2"><strong>Legal Form:</strong> [To be specified]</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong></p>
              <p className="text-gray-700 ml-4 mb-2">[Street Address]</p>
              <p className="text-gray-700 ml-4 mb-2">[Postal Code] [City]</p>
              <p className="text-gray-700 ml-4 mb-4">Germany</p>
              
              <p className="text-gray-700 mb-2"><strong>Phone:</strong> [To be provided]</p>
              <p className="text-gray-700 mb-2"><strong>Email:</strong> info@kisigua.com</p>
              <p className="text-gray-700 mb-2"><strong>Website:</strong> https://kisigua.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authorized Representative</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Managing Director:</strong> [To be specified]</p>
              <p className="text-gray-700 mb-2"><strong>Responsible for Content:</strong> [To be specified]</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Commercial Register:</strong> [To be specified]</p>
              <p className="text-gray-700 mb-2"><strong>Registration Number:</strong> [To be specified]</p>
              <p className="text-gray-700 mb-2"><strong>VAT ID:</strong> [To be specified]</p>
              <p className="text-gray-700 mb-2"><strong>Tax Number:</strong> [To be specified]</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Liability Insurance</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Insurance Company:</strong> [To be specified]</p>
              <p className="text-gray-700 mb-2"><strong>Coverage Area:</strong> Germany/EU</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              The European Commission provides a platform for online dispute resolution (ODR): 
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" 
                 className="text-green-600 hover:text-green-700 underline ml-1">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-gray-700 mb-4">
              We are not willing or obliged to participate in dispute resolution proceedings before 
              a consumer arbitration board.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Liability for Content</h2>
            <p className="text-gray-700 mb-4">
              As service providers, we are liable for own contents of these websites according to 
              Sec. 7, Para. 1 German Telemedia Act (TMG). However, according to Sec. 8 to 10 German 
              Telemedia Act (TMG), service providers are not under obligation to permanently monitor 
              submitted or stored information or to search for evidences that indicate illegal activities.
            </p>
            <p className="text-gray-700 mb-4">
              Legal obligations to removing information or to blocking the use of information remain 
              unchallenged. In this case, liability is only possible at the time of knowledge about 
              a specific violation of law. Illegal contents will be removed immediately at the time 
              we get knowledge of them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Liability for Links</h2>
            <p className="text-gray-700 mb-4">
              Our offer includes links to external third party websites. We have no influence on the 
              contents of those websites, therefore we cannot guarantee for those contents. Providers 
              or administrators of linked websites are always responsible for their own contents.
            </p>
            <p className="text-gray-700 mb-4">
              The linked websites had been checked for possible violations of law at the time of the 
              establishment of the link. Illegal contents were not detected at the time of the linking. 
              A permanent monitoring of the contents of linked websites cannot be imposed without 
              reasonable indications that there has been a violation of law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Copyright</h2>
            <p className="text-gray-700 mb-4">
              Contents and compilations published on these websites by the providers are subject to 
              German copyright laws. Reproduction, editing, distribution as well as the use of any 
              kind outside the scope of the copyright law require a written permission of the author 
              or originator.
            </p>
            <p className="text-gray-700 mb-4">
              Downloads and copies of these websites are permitted for private use only. The commercial 
              use of our contents without permission of the originator is prohibited.
            </p>
            <p className="text-gray-700">
              Copyright laws of third parties are respected as long as the contents on these websites 
              do not originate from the provider. Contributions of third parties on this site are 
              indicated as such. However, if you notice any violations of copyright law, please inform 
              us. Such contents will be removed immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Protection</h2>
            <p className="text-gray-700">
              Please refer to our 
              <button className="text-green-600 hover:text-green-700 underline ml-1">
                Privacy Policy
              </button> 
              for detailed information about how we handle your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact for Legal Matters</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Legal Department:</strong> legal@kisigua.com</p>
              <p className="text-gray-700 mb-2"><strong>Data Protection Officer:</strong> dpo@kisigua.com</p>
              <p className="text-gray-700 mb-2"><strong>Copyright Issues:</strong> copyright@kisigua.com</p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              This imprint was last updated on {new Date().toLocaleDateString()} and complies with 
              German legal requirements under § 5 TMG and § 55 RStV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Imprint;
