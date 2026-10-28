// Adapter för Algolia Search. Det här är den enda filen som "vet om" Algolia
// Två klienter: adminClient (write access med admin API key) och searchClient (bara read access)
// Admin-nyckeln finns bara server-side, *aldrig i webbläsaren*

import { algoliasearch } from 'algoliasearch';