// Liste simple des villes d'Haïti (sans départements) - doublons supprimés
const citiesList = [
  // Artibonite
  "Gonaïves", "Saint-Marc", "Verrettes", "Dessalines", "Petite-Rivière-de-l'Artibonite",
  "Gros-Morne", "Anse-Rouge", "Terre-Neuve", "Marchand-Dessalines", "L'Estère", 
  "Grande-Saline", "Ennery", "La Chapelle", "Pilate", "Marmelade",
  
  // Centre
  "Hinche", "Mirebalais", "Boucan-Carré", "Cerca-la-Source", "Cerca-Cavajal",
  "Lascahobas", "Belladère", "Savanette", "Thomonde",
  
  // Grand'Anse
  "Jérémie", "Anse-d'Hainault", "Dame-Marie", "Les Irois", "Corail",
  "Roseaux", "Chambellan", "Moron", "Abricots", "Bonbon",
  
  // Nippes
  "Miragoâne", "Anse-à-Veau", "Baradères", "Petit-Trou-de-Nippes", "Arnaud",
  "L'Asile", "Plaisance-du-Sud", "Paillant", "Fond-des-Nègres",
  
  // Nord
  "Cap-Haïtien", "Limbé", "Acul-du-Nord", "Milot", "Plaine-du-Nord",
  "Quartier-Morin", "Dondon", "Ranquitte", "Pignon", "Borgne", "Bahon",
  
  // Nord-Est
  "Fort-Liberté", "Ouanaminthe", "Trou-du-Nord", "Caracol", "Terrier-Rouge",
  "Perches", "Mont-Organisé", "Carice", "Capotille",
  
  // Nord-Ouest
  "Port-de-Paix", "Môle-Saint-Nicolas", "Jean-Rabel", "Bombardopolis", "Baie-de-Henne",
  "Anse-à-Foleur", "Tortuga", "Chansolme", "Saint-Louis-du-Nord",
  
  // Ouest
  "Port-au-Prince", "Carrefour", "Delmas", "Pétion-Ville", "Cité Soleil",
  "Kenscoff", "Tabarre", "Croix-des-Bouquets", "Ganthier", "Cornillon", 
  "Fonds-Verrettes", "Léogâne", "Grand-Goâve", "Petit-Goâve", "Arcahaie", 
  "Cabaret", "Anse-à-Galets", "Île de la Gonâve",
  
  // Sud
  "Les Cayes", "Aquin", "Cavaillon", "Chantal", "Côteaux",
  "Île-à-Vache", "Port-Salut", "Roche-à-Bateaux", "Saint-Jean-du-Sud",
  "Tiburon", "Torbeck", "Camp-Perrin", "Maniche", "Chardonnières",
  
  // Sud-Est
  "Jacmel", "Bainet", "Belle-Anse", "Côtes-de-Fer", "Grand-Gosier",
  "Marigot", "Thiotte", "Anse-à-Pitres"
];

// Supprimer les doublons et trier
export const allCities = [...new Set(citiesList)].sort();

// Fonction pour rechercher des villes
export const searchCities = (query: string): string[] => {
  if (!query.trim()) return allCities;
  const searchTerm = query.toLowerCase().trim();
  return allCities.filter(city => 
    city.toLowerCase().includes(searchTerm)
  );
};

// Fonction pour ajouter une nouvelle ville (simulation)
export const addNewCity = (cityName: string, department: string): void => {
  if (haitiCities[department as keyof typeof haitiCities]) {
    haitiCities[department as keyof typeof haitiCities].push(cityName);
  }
};