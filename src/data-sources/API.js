// Notes: c'est la même instance qui sera utilisée par tous
// les plugins qui utilisent l'API. Quand la première requête
// est reçu, fait la requête sur le serveur. Si d'autres
// requêtes sont demandées avant que la première ne soit
// terminée, les autres sont mises en file d'attente. Quand la
// première requête est terminée, repars un appel à l'API avec
// toutes les requêtes qui attendent.
// Si le serveur ne répond pas, il faudrait un mécanisme qui
// va réessayer plus tard
