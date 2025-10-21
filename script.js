// --- VARIABLES GLOBALES --- //
let joueurs = [];
let parties = [];
let cartes = {
  evenement: [],
  action: [],
  flash: [],
};

let etatPartie = {
  tour: 1,
  joueurActif: 0,
};

// --- CHARGEMENT DES DONNÉES --- //
async function chargerDonnees() {
  try {
    const [p, e, a, f] = await Promise.all([
      fetch("data/parties.json").then((res) => res.json()),
      fetch("data/cartes_evenement.json").then((res) => res.json()),
      fetch("data/cartes_action.json").then((res) => res.json()),
      fetch("data/cartes_flash_info.json").then((res) => res.json()),
    ]);

    parties = p;
    cartes.evenement = e;
    cartes.action = a;
    cartes.flash = f;

    afficherFormulaireJoueur();
  } catch (err) {
    console.error("Erreur de chargement des données :", err);
    alert(
      "Impossible de charger les données. Vérifie les fichiers JSON et le serveur."
    );
  }
}

// --- GESTION DES JOUEURS --- //
function ajouterJoueur() {
  joueurs.push({ nom: "", parti: null, pp: 5 });
  afficherFormulaireJoueur();
}

function afficherFormulaireJoueur() {
  const container = document.getElementById("joueurs");
  container.innerHTML = "";

  joueurs.forEach((joueur, index) => {
    const div = document.createElement("div");
    div.classList.add("joueur-form");

    div.innerHTML = `
      <input 
        type="text" 
        placeholder="Nom du joueur"
        onchange="majNom(${index}, this.value)" 
        value="${joueur.nom}" 
      />
      <select onchange="majParti(${index}, this.value)">
        <option value="">Choisir un parti</option>
        ${parties
          .filter(
            (p) =>
              !joueurs.some((j, i) => j.parti?.id === p.id && i !== index) ||
              joueur.parti?.id === p.id
          )
          .map(
            (p) =>
              `<option value="${p.id}" ${
                joueur.parti?.id === p.id ? "selected" : ""
              }>${p.nom}</option>`
          )
          .join("")}
      </select>
    `;
    container.appendChild(div);
  });
}

function majNom(index, nom) {
  if (joueurs[index]) joueurs[index].nom = nom.trim();
}

function majParti(index, id) {
  const parti = parties.find((p) => p.id == id);
  if (joueurs[index]) joueurs[index].parti = parti || null;
}

// --- DEMARRER LE JEU --- //
function demarrerJeu() {
  if (joueurs.length === 0) {
    alert("Ajoute au moins un joueur avant de commencer !");
    return;
  }
  if (joueurs.some((j) => !j.nom || !j.parti)) {
    alert("Chaque joueur doit avoir un nom et un parti.");
    return;
  }

  document.getElementById("setup").style.display = "none";
  document.getElementById("jeu").style.display = "block";

  afficherEtatJeu();
}

// --- AFFICHAGE DES FICHES JOUEURS --- //
function afficherFichesJoueurs() {
  const zone = document.getElementById("fiches-joueurs");
  zone.innerHTML = "";

  joueurs.forEach((j, index) => {
    const p = j.parti;

    const fiche = document.createElement("div");
    fiche.classList.add("fiche-joueur");
    fiche.id = `fiche-${index}`;

    fiche.innerHTML = `
      <h3>${j.nom}</h3>
      <h4>${p.nom}</h4>
      <p><strong>Leader :</strong> ${p.leader}</p>
      <p><strong>Idéologie :</strong> ${p.ideologie}</p>
      <p><strong>Slogan :</strong> « ${p.slogan} »</p>
      <p><strong>Catégorie :</strong> ${p.categorie}</p>
      <p><strong>Pouvoir :</strong> ${p.pouvoir}</p>
      <p><strong>Cartes Événement :</strong> ${p.cartes_evenement.join(
        ", "
      )}</p>
      <p><strong>Cartes Action :</strong> ${p.cartes_action.join(", ")}</p>
      <p><strong>PP :</strong> <span id="pp-${index}">${j.pp}</span></p>
    `;

    zone.appendChild(fiche);
  });
}

// --- AFFICHER ÉTAT GLOBAL --- //
function afficherEtatJeu() {
  const div = document.getElementById("etat-jeu");
  div.innerHTML = `
    <h2>État des joueurs</h2>
    <div class="grille-joueurs">
      ${joueurs
        .map(
          (j) => `
        <div class="fiche-joueur ${j.actif ? "actif" : ""}">
          <h3>${j.nom}</h3>
          <h4>${j.parti.nom}</h4>
          <p><strong>Leader :</strong> ${j.parti.leader}</p>
          <p><strong>Idéologie :</strong> ${j.parti.ideologie}</p>
          <p><strong>Slogan :</strong> ${j.parti.slogan}</p>
          <p><strong>Catégorie :</strong> ${j.parti.categorie}</p>
          <p><strong>Pouvoir :</strong> ${j.parti.pouvoir}</p>
          <p><strong>PP :</strong> <span class="pp">${j.pp}</span></p>
        </div>`
        )
        .join("")}
    </div>`;
}

// --- PIOCHER UNE CARTE --- //
function piocher(type) {
  const pile = cartes[type];
  if (!pile || pile.length === 0) {
    document.getElementById("resultat").innerText = "Aucune carte disponible.";
    return;
  }

  // Tirage aléatoire d'une carte
  const carte = pile[Math.floor(Math.random() * pile.length)];

  // Appliquer l'effet logique
  appliquerEffetCarte(carte, type);

  // Afficher la carte tirée
  afficherCarte(carte, type);
}

// --- AFFICHER UNE CARTE --- //

function afficherCarte(carte, type) {
  const resultatDiv = document.getElementById("resultat");
  let html = `
    <div class="carte-tiree">
      <h3>${carte.titre}</h3>
      <p><strong>Type :</strong> ${
        type.charAt(0).toUpperCase() + type.slice(1)
      }</p>
      <p><strong>Effet :</strong> ${carte.effet}</p>
  `;

  // ✅ Ajout de la description spécifique aux cartes événement
  if (type === "evenement" && carte.description) {
    html += `<p><strong>Description :</strong> ${carte.description}</p>`;
  }

  if (carte.bonus) {
    html += `<p><strong>Bonus :</strong> ${carte.bonus}</p>`;
  }

  html += `</div>`;
  resultatDiv.innerHTML = html;
}
// --- APPLIQUER L’EFFET SUR LES POINTS --- //
function appliquerEffetCarte(carte, type) {
  let changements = [];

  // --- Effet des cartes ÉVÉNEMENT ---
  if (type === "evenement" && carte.effet) {
    // ex : "-2 PP pour les Cyniques & Satiristes"
    const match = carte.effet.match(/([+-]?\d+)\s*PP\s*pour\s*les\s*(.+)/i);
    if (match) {
      const delta = parseInt(match[1]);
      const categorie = match[2].trim();

      joueurs.forEach((joueur, i) => {
        if (joueur.parti && joueur.parti.categorie === categorie) {
          joueur.pp += delta;
          if (joueur.pp < 0) joueur.pp = 0;
          changements.push({ index: i, delta });
        }
      });
    }
  }

  // --- Effet des cartes ACTION avec "bonus" ---
  if (type === "action" && carte.bonus) {
    joueurs.forEach((joueur, i) => {
      if (joueur.parti && joueur.parti.nom === carte.bonus) {
        joueur.pp += 1;
        changements.push({ index: i, delta: +1 });
      }
    });
  }

  // --- Mise à jour visuelle immédiate ---
  changements.forEach(({ index, delta }) => {
    const joueurDiv = document.querySelectorAll(".fiche-joueur")[index];
    if (joueurDiv) {
      const ppSpan = joueurDiv.querySelector(".pp");
      if (ppSpan) {
        ppSpan.textContent = joueurs[index].pp;
        // petite animation visuelle pour montrer la variation
        ppSpan.style.color = delta > 0 ? "green" : "red";
        setTimeout(() => (ppSpan.style.color = "#333"), 1000);
      }
    }
  });
}
afficherEtatJeu();

// --- CHARGEMENT AUTOMATIQUE --- //
window.addEventListener("DOMContentLoaded", chargerDonnees);
