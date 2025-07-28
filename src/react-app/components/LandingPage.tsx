import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToApp: () => void;
  onNavigateToSearch: () => void;
}

const LandingPage = ({ onNavigateToAuth, onNavigateToApp, onNavigateToSearch }: LandingPageProps) => {
  const [language, setLanguage] = useState('en');
  const { isAuthenticated, user } = useAuth();

  const content = {
    en: {
      title: "Kisigua",
      subtitle: "Connecting Communities with Local Resources",
      description: "Discover organic farms, local products, fresh water sources, and sustainable goods in your community. Join our mission to support local producers and promote sustainable living.",
      features: [
        "Find organic farms and local producers",
        "Locate fresh water sources and vending machines",
        "Discover handcrafted goods and artisan products",
        "Support sustainable and eco-friendly businesses"
      ],
      cta: "Explore Local Resources",
      secondaryCta: "Learn More",
      signIn: "Sign In",
      getStarted: "Get Started",
      dashboard: "Dashboard",
      languages: {
        en: "English",
        de: "Deutsch",
        it: "Italiano",
        es: "Español",
        fr: "Français"
      }
    },
    de: {
      title: "Kisigua",
      subtitle: "Gemeinschaften mit lokalen Ressourcen verbinden",
      description: "Entdecken Sie Bio-Bauernhöfe, lokale Produkte, Trinkwasserquellen und nachhaltige Waren in Ihrer Gemeinde. Unterstützen Sie lokale Produzenten und fördern Sie nachhaltiges Leben.",
      features: [
        "Bio-Bauernhöfe und lokale Produzenten finden",
        "Trinkwasserquellen und Automaten lokalisieren",
        "Handwerkliche Waren und Kunsthandwerk entdecken",
        "Nachhaltige und umweltfreundliche Unternehmen unterstützen"
      ],
      cta: "Lokale Ressourcen erkunden",
      secondaryCta: "Mehr erfahren",
      signIn: "Anmelden",
      getStarted: "Loslegen",
      dashboard: "Dashboard",
      languages: {
        en: "English",
        de: "Deutsch",
        it: "Italiano",
        es: "Español",
        fr: "Français"
      }
    },
    it: {
      title: "Kisigua",
      subtitle: "Connettere le Comunità con le Risorse Locali",
      description: "Scopri fattorie biologiche, prodotti locali, fonti d'acqua potabile e beni sostenibili nella tua comunità. Unisciti alla nostra missione per supportare i produttori locali e promuovere uno stile di vita sostenibile.",
      features: [
        "Trova fattorie biologiche e produttori locali",
        "Localizza fonti d'acqua potabile e distributori automatici",
        "Scopri prodotti artigianali e opere d'arte",
        "Supporta aziende sostenibili ed eco-friendly"
      ],
      cta: "Esplora Risorse Locali",
      secondaryCta: "Scopri di più",
      signIn: "Accedi",
      getStarted: "Inizia",
      dashboard: "Dashboard",
      languages: {
        en: "English",
        de: "Deutsch",
        it: "Italiano",
        es: "Español",
        fr: "Français"
      }
    },
    es: {
      title: "Kisigua",
      subtitle: "Conectando Comunidades con Recursos Locales",
      description: "Descubre granjas orgánicas, productos locales, fuentes de agua potable y bienes sostenibles en tu comunidad. Únete a nuestra misión de apoyar a los productores locales y promover la vida sostenible.",
      features: [
        "Encuentra granjas orgánicas y productores locales",
        "Localiza fuentes de agua potable y máquinas expendedoras",
        "Descubre productos artesanales y obras de arte",
        "Apoya empresas sostenibles y ecológicas"
      ],
      cta: "Explorar Recursos Locales",
      secondaryCta: "Saber más",
      signIn: "Iniciar Sesión",
      getStarted: "Comenzar",
      dashboard: "Panel",
      languages: {
        en: "English",
        de: "Deutsch",
        it: "Italiano",
        es: "Español",
        fr: "Français"
      }
    },
    fr: {
      title: "Kisigua",
      subtitle: "Connecter les Communautés aux Ressources Locales",
      description: "Découvrez des fermes biologiques, des produits locaux, des sources d'eau potable et des biens durables dans votre communauté. Rejoignez notre mission pour soutenir les producteurs locaux et promouvoir un mode de vie durable.",
      features: [
        "Trouvez des fermes biologiques et des producteurs locaux",
        "Localisez des sources d'eau potable et des distributeurs automatiques",
        "Découvrez des produits artisanaux et des œuvres d'art",
        "Soutenez des entreprises durables et écologiques"
      ],
      cta: "Explorer les Ressources Locales",
      secondaryCta: "En savoir plus",
      signIn: "Se Connecter",
      getStarted: "Commencer",
      dashboard: "Tableau de Bord",
      languages: {
        en: "English",
        de: "Deutsch",
        it: "Italiano",
        es: "Español",
        fr: "Français"
      }
    }
  };

  const currentContent = content[language as keyof typeof content];

  const handleExploreClick = () => {
    if (isAuthenticated) {
      onNavigateToApp();
    } else {
      onNavigateToAuth();
    }
  };

  const handleLearnMoreClick = () => {
    onNavigateToSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">{currentContent.title}</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Authentication Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-medium text-sm">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <button
                  onClick={onNavigateToApp}
                  className="ml-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {currentContent.dashboard}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onNavigateToAuth}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {currentContent.signIn}
                </button>
                <button
                  onClick={onNavigateToAuth}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {currentContent.getStarted}
                </button>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                {Object.entries(currentContent.languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {currentContent.subtitle}
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {currentContent.description}
          </p>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            {currentContent.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleExploreClick}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
            >
              {currentContent.cta}
            </button>
            <button
              onClick={handleLearnMoreClick}
              className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
            >
              {currentContent.secondaryCta}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2024 Kisigua. A non-profit initiative for sustainable communities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
