ALTER TABLE "User"
  -- Googles unika användar-ID (från OIDC id_token). Google användare identifieras med denna, 
  -- inte e-post. NULL för de som använder lösenord istället
  ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) UNIQUE,

  -- Denna är antingen 'local' (användarnamn + lösenord) eller 'google'
  -- Genom att göra 'local' till default ser vi till att alla befintliga rader får rätt värde automatiskt
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';

-- password är nu nullable. Google-användare autentiserar via Google, inte med lösenord.
ALTER TABLE "User"
  ALTER COLUMN password DROP NOT NULL;

-- Två separata clauses endast för readability. En för “adding new things” och en för “changing an existing thing.”
-- Viktigt för laborationen också: genom att lägga till `google_sub` så möjliggör vi för att ha två separata konton 
-- för en användare istället för att automatiskt slå ihop dem. Men det beslutet är inte 100% taget än.
