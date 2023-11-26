# Mon vieux Grimoire


## Comment lancer le projet ? 

### Avec npm

Faites cette liste de commande à la suite et dans l'ordre pour installer les dépendances du projet :

`npm install -g nodemon`
`npm install express`
`npm install mangodb`
`npm install mongoose`
`npm install --force mongoose-unique-validator`
`npm install --force bcrypt`
`npm install --force jsonwebtoken`
`npm install --force multer`
`npm install --force sharp`

Lancer ensuite `npm start` à la racine du projet pour lancer la partie Frontend du projet.

Et lancer par la suite dans un second terminal depuis la racine du projet :
`cd .\backend\` suivit de `nodemon server` pour lancer l'API backend du site :

Le projet a été testé sur node 19.