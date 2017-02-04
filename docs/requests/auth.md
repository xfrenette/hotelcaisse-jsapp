Requête pour valider que le device est toujours authentifié

POST validate_token:
{
	token (un mélange du token et de l'id du device ?)
}

Réponse
{
	code: OK, INVALID
	new_token: (si OK)
	expires_at: datetime
}

---

Requête la première fois

POST authenticate
{
	device_id: (adresse MAC, par exemple)
	code: code de 4 chiffres pour l'authentification
}

Sur le serveur
- Vérifie si une authentification est en attente
- Vérifie si le code est bon
- Si oui, crée le device
- Crée une session et retourne le token
