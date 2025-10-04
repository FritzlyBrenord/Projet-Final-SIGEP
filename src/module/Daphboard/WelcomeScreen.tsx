"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Rocket,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  LogOut,
} from "lucide-react";
import { useRouteProtection } from "@/components/ProtectedPage";

interface WelcomeScreenProps {
  userName?: string;
  isDarkMode: boolean;
  isSuperAdmin: boolean;
  onStartConfiguration: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  isDarkMode,
  isSuperAdmin,
  onStartConfiguration,
}) => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const { handleLogout, isLoggingOut } = useRouteProtection();
  const faqData: FAQItem[] = [
    {
      question: "Comment créer une année scolaire ?",
      answer:
        "Pour créer une année scolaire : 1) Cliquez sur 'Commencer maintenant' ci-dessous . 2) Entrez l'année au format YYYY-YYYY (ex: 2024-2025). 3) Ajoutez une description optionnelle. 4) Cliquez sur 'Créer'. L'année sera automatiquement définie comme année courante.",
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
    },
    {
      question: "Comment inscrire un élève ?",
      answer:
        "Pour inscrire un élève : 1) Assurez-vous qu'une année scolaire est créée et active. 2) Allez dans le menu 'Élèves'. 3) Cliquez sur ' Inscription'. 4) Remplissez les informations obligatoires (nom, prénom, date de naissance, classe,salle etc..). 5) Ajoutez les informations complémentaires (tuteur, contacts, photo). 6) Validez l'inscription. Un code unique sera généré automatiquement.",
      icon: <GraduationCap className="w-5 h-5 text-green-500" />,
    },
    {
      question: "Comment configurer les classes et salles ?",
      answer:
        "La hiérarchie est : Année Scolaire → Classes → Salles → Matières. 1) Dans 'Années Scolaires', sélectionnez une année. 2) Cliquez sur 'Configurer les classes'. 3) Ajoutez des classes (ex: 6ème Année). 4) Pour chaque classe, ajoutez des salles avec leur capacité. 5) Dans chaque salle, définissez les matières avec leurs coefficients. 6) Assignez des professeurs aux matières. 7) Configurez l'emploi du temps.",
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
    },
    {
      question: "Comment gérer les employés et professeurs ?",
      answer:
        "Pour le personnel : 1) Menu 'Employés' : Ajoutez tous les employés (administration, professeurs, personnel). 2) Menu 'Professeurs' : Vue spécifique des enseignants avec leurs matières et emplois du temps. 3) Renseignez les informations (nom, prénom, email, téléphone, département, fonction). 4) Pour les professeurs, assignez-les aux matières dans la configuration des salles. Chaque employé peut recevoir un compte utilisateur avec des permissions spécifiques.",
      icon: <Users className="w-5 h-5 text-orange-500" />,
    },
    {
      question: "Comment attribuer les permissions ?",
      answer: "Système de permissions : ",
      icon: <Shield className="w-5 h-5 text-red-500" />,
    },
    {
      question: "Que faire en cas de problème technique ?",
      answer:
        "En cas de problème : 1) Vérifiez votre connexion internet. 2) Rafraîchissez la page (F5). 3) Vérifiez que vous avez les permissions nécessaires. 4) Si l'année scolaire ne s'affiche pas, allez dans 'Années Scolaires' et sélectionnez-la. 5) Pour les erreurs persistantes, contactez le Super Admin ou l'administrateur système. 6) Utilisez le bouton 'Déconnexion' et reconnectez-vous si nécessaire.",
      icon: <HelpCircle className="w-5 h-5 text-yellow-500" />,
    },
  ];

  const systemFeatures = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Gestion des élèves",
      description: "Inscriptions, suivi académique et dossiers complets",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Personnel scolaire",
      description: "Gestion des professeurs, employés et leurs affectations",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Configuration académique",
      description: "Classes, salles, matières et emplois du temps",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Années scolaires",
      description: "Gestion multi-années avec historique complet",
    },
  ];

  const handleStartClick = () => {
    if (!isSuperAdmin) {
      setShowPermissionError(true);
      setTimeout(() => setShowPermissionError(false), 5000);
    } else {
      onStartConfiguration();
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-amber-50"
      }`}
    >
      {/* Contenu principal */}
      <div className="max-w-5xl w-full">
        {/* En-tête de bienvenue */}
        <div className="text-center mb-12 animate-fade-in">
          <div
            className={`inline-block p-4 rounded-full mb-6 ${
              isDarkMode
                ? "bg-gradient-to-r from-blue-600/20 to-amber-600/20"
                : "bg-gradient-to-r from-blue-100 to-amber-100"
            }`}
          >
            <Rocket
              className={`w-16 h-16 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
            />
          </div>

          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Bienvenue sur SIGEP, {userName} !
          </h1>

          <p
            className={`text-lg md:text-xl mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Système Intégré de Gestion d'Établissement Pédagogique
          </p>

          {isSuperAdmin && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-semibold mt-4">
              <Shield className="w-4 h-4" />
              <span>Connecté en tant que Super Admin</span>
            </div>
          )}
        </div>

        <button
          className={`w-40 mb-5 cursor-pointer rounded-lg text-left px-4 py-2 text-sm text-red-600 transition-all duration-200 flex items-center hover:scale-105 ${
            isDarkMode
              ? "hover:bg-gradient-to-r hover:from-red-900/30 hover:to-red-800/30"
              : "hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100"
          }`}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
        </button>

        {/* Message d'erreur de permission */}
        {showPermissionError && (
          <div
            className={`mb-6 p-4 rounded-xl border-l-4 border-red-500 ${
              isDarkMode
                ? "bg-red-900/30 text-red-200"
                : "bg-red-50 text-red-800"
            } animate-slide-down`}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-semibold">Accès refusé</p>
                <p className="text-sm">
                  Seul le Super Admin peut créer une année scolaire. Veuillez
                  contacter l'administrateur système.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Carte principale */}
        <div
          className={`rounded-2xl shadow-2xl p-8 md:p-12 mb-8 ${
            isDarkMode
              ? "bg-gray-800/50 backdrop-blur-lg border border-gray-700/50"
              : "bg-white/80 backdrop-blur-lg border border-gray-200/50"
          }`}
        >
          {/* Message principal */}
          <div
            className={`text-center mb-10 p-6 rounded-xl ${
              isDarkMode
                ? "bg-gradient-to-r from-blue-900/30 to-amber-900/30 border border-blue-700/30"
                : "bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-200/30"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-3 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Aucune année scolaire n'est configurée
            </h2>
            <p
              className={`text-base ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Pour commencer à utiliser le système, vous devez d'abord créer une
              année scolaire. C'est la première étape essentielle qui vous
              permettra ensuite de configurer vos classes, salles, matières et
              d'inscrire vos élèves.
            </p>
          </div>

          {/* Fonctionnalités du système */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {systemFeatures.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-700/50 hover:bg-gray-700/70"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg mb-4 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-blue-600/20 to-amber-600/20"
                      : "bg-gradient-to-r from-blue-100 to-amber-100"
                  }`}
                >
                  <div
                    className={isDarkMode ? "text-blue-400" : "text-blue-600"}
                  >
                    {feature.icon}
                  </div>
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Étapes de démarrage */}
          <div
            className={`mb-10 p-6 rounded-xl ${
              isDarkMode
                ? "bg-gray-700/30 border border-gray-600/30"
                : "bg-blue-50/50 border border-blue-200/30"
            }`}
          >
            <h3
              className={`text-xl font-bold mb-4 flex items-center ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
              Pour démarrer avec SIGEP
            </h3>
            <ol className="space-y-3">
              {[
                "Créez votre première année scolaire (ex: 2024-2025)",
                "Configurez vos classes et salles de classe",
                "Ajoutez les matières avec leurs coefficients",
                "Inscrivez vos professeurs et employés",
                "Commencez les inscriptions d'élèves",
              ].map((step, index) => (
                <li
                  key={index}
                  className={`flex items-start ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 flex-shrink-0 text-sm font-bold ${
                      isDarkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartClick}
              className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isSuperAdmin
                  ? "bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white"
                  : "bg-gray-400 cursor-not-allowed text-gray-200"
              }`}
            >
              <Rocket className="w-5 h-5" />
              <span>Commencer maintenant</span>
            </button>

            <button
              onClick={() => setShowFAQ(true)}
              className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200"
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span>Besoin d'aide ?</span>
            </button>
          </div>

          {!isSuperAdmin && (
            <div
              className={`mt-6 p-4 rounded-lg text-center text-sm ${
                isDarkMode
                  ? "bg-yellow-900/20 text-yellow-300 border border-yellow-800"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Vous devez être Super Admin pour créer une année scolaire.
              Contactez l'administrateur système.
            </div>
          )}
        </div>
      </div>

      {/* Modal FAQ */}
      {showFAQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Header de la modal */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    isDarkMode ? "bg-blue-600/20" : "bg-blue-100"
                  }`}
                >
                  <HelpCircle
                    className={`w-6 h-6 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Questions fréquentes (FAQ)
                </h2>
              </div>
              <button
                onClick={() => setShowFAQ(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu FAQ */}
            <div className="p-6 space-y-4">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                      isDarkMode ? "hover:bg-gray-700/70" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          isDarkMode ? "bg-gray-600" : "bg-white"
                        }`}
                      >
                        {faq.icon}
                      </div>
                      <span
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>
                    {openFAQIndex === index ? (
                      <ChevronUp
                        className={`w-5 h-5 flex-shrink-0 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                    ) : (
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                    )}
                  </button>

                  {openFAQIndex === index && (
                    <div
                      className={`p-5 pt-0 border-t ${
                        isDarkMode ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      <p
                        className={`text-sm leading-relaxed ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer de la modal */}
            <div
              className={`sticky bottom-0 p-6 border-t ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <button
                onClick={() => setShowFAQ(false)}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
