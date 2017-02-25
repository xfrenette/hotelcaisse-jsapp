Requête la première fois

POST authenticate
{
	deviceUUID: (adresse MAC, par exemple)
	code: code de 4 chiffres pour l'authentification
}

Sur le serveur
- Vérifie si une authentification est en attente
- Vérifie si le code est bon
- Si oui, crée le device
- Crée une session et retourne le token

Pour le format de la réponse, voir api.md
