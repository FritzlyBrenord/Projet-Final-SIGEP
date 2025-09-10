import { createClient } from "@supabase/supabase-js";

const supabseUrl:any=process.env.NEXT_PUBLIC_SUPABASE_URL
const supabseAnonKey:any=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClient(
  supabseUrl, 
  supabseAnonKey
);

//Autorisation
//create policy "autorisation de lecture public" on "Categories" For Select using (true) Table Produit
//create policy "autorisation de lecture public table Categories" on "Categories" For Select using (true) //Categorie
//create policy "autorisation de lecture public table Baniere" on "Baniere" For Select using (true) //Baniere
//create policy "autorisation de lecture public table Offre" on "Offre" For Select using (true) // Offre
//create policy "autorisation de creer un compte table Users" on "Users" For insert with check (true) // Users
//create policy "autorisation lecture compte utilisateur" on "Users" For Select using (auth.email()=email) // Ussers
//create policy "autorisation placer commande2" on "Commande" For insert with check (auth.email()=email)
//create policy "autorisation de lecture Affichage" on "AffichageProd" For Select using (true) //AffichageProd
//create policy "autorisation d'ecriture Affichage" on "AffichageProd" For insert with check (true) //AffichageProd
//create policy "autorisation de lecture commande" on "Commande" For Select using (true)
//Supression
//drop policy "autorisation de creer un compte table Users" on "Users"

//drop policy "autorisation placer commande2" on "Commande"

// GRANT USAGE ON SCHEMA sgjbl TO postgres, authenticated, anon;
// GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sgjbl TO postgres, authenticated, anon;
// ALTER DEFAULT PRIVILEGES IN SCHEMA sgjbl
// GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO postgres, authenticated, anon;

//ALTER TABLE "Services" enable row level security
//create policy "autorisation de creer un utilisateur" on "Utilisateur" For insert with check (true)
//create policy "autorisation de lecture Employer" on "Employer" For Select using (true)
// {"CREATE POLICY "Lecture autorisée pour les utilisateurs avec ToutLesDroits"
// ON "Services"
// FOR SELECT
// USING (
//   auth.uid() IN (
//     SELECT id FROM "Utilisateur" WHERE "Utilisateur"."ToutLesDroits"= true
//   )
// );"}
