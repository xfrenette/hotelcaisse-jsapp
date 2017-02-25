Toutes les requêtes à l'API (pas pour l'auth) doivent être de ce format:
{
	token: string // token d'authentification
	version: string // Dernier numéro de version connu
	data: mixed // données pour la requête
}

Toutes les réponses de l'API (pas pour l'auth) sont de ce format:
{
	version: string // Numéro de version des données
	data: mixed // Données demandées, ex: le business quand demandé explicitement
	newBusinessData: object|null // Si une requête autre que pour business et que le serveur juge que le frontend a peut-être des données périmées (numéro de version plus bon), il retourne le Business complet dans cette propriété
	status: ok|error // error aussi si probl. d'auth
	error: { // Only if status = error
		code: string // peut être, par ex, authentication.invalid
		message: string // Message for the developper
		userMessage: string // (Optional) message that should be shown to the user
	}
}
