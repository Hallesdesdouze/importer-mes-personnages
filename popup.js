let extractedJSON = "";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => {
        const el = document.querySelector("dofus-transfer-server");
        const nick = document.querySelector(".nickname");
  
        if (!el || !el.getAttribute("data-characters")) return null;
  
        let characters = [];
        try {
            characters = JSON.parse(el.getAttribute("data-characters"));
        } catch (e) {
            return null;
        }
  
        const simplified = characters.map(char => ({
            server: char.server,
            name: char.name,
            level: char.level,
            class: char.breed
        }));
  
        return {
            characters: simplified,
            characterWhois: nick ? nick.textContent.trim() : ""
        };
    }
  }, (results) => {
    const result = results && results[0] ? results[0].result : null;
    const message = document.getElementById("message");
    const button = document.getElementById("submitBtn");

    if (!result || !result.characters || result.characters.length === 0) {
        message.innerHTML = `Veuillez vous rendre sur la page de la boutique : <a href="https://store.ankama.com/fr/729-dofus/797-services/a-15144-transfert-de-personnage-vers-un-serveur" target="_blank">Transfert de personnage vers un serveur</a>`;
        button.style.display = "none";
        return;
    }

    extractedJSON = JSON.stringify(result.characters, null, 2);
    extractedAccName = result.characterWhois;

    message.style.display = "none";
    button.style.display = "block";
  });
});

document.getElementById("submitBtn").addEventListener("click", () => {
    if (!extractedJSON) return;
  
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.halles-des-douze.fr/utilisateurs/mon-profil/importer-mes-personnages";
    form.target = "_blank";
  
    const charactersJsonField = document.createElement("input");
    charactersJsonField.type = "hidden";
    charactersJsonField.name = "charactersJson";
    charactersJsonField.value = extractedJSON;
    form.appendChild(charactersJsonField);

    const characterWhoisField = document.createElement("input");
    characterWhoisField.type = "hidden";
    characterWhoisField.name = "characterWhois";
    characterWhoisField.value = extractedAccName;
    form.appendChild(characterWhoisField);

    document.body.appendChild(form);
    form.submit();
    form.remove();
  });