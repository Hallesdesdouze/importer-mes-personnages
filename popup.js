let extractedData = null;
let extractedNickname = '';

const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

const showError = () => {
	messageEl.innerHTML = `Veuillez vous rendre sur la page de la boutique : <a href="https://store.ankama.com/fr/729-dofus/797-services/a-15144-transfert-de-personnage-vers-un-serveur" target="_blank">Transfert de personnage vers un serveur</a>`;
	submitBtn.style.display = "none";
};

async function extractCharacters() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		
		if (!tab?.url?.includes('store.ankama.com')) {
			showError();
			return;
		}

		const [result] = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				try {
					const el = document.querySelector("dofus-transfer-server");
					const characters = JSON.parse(el?.getAttribute("data-characters") || '[]');
					const nickname = document.querySelector(".nickname")?.textContent.trim() || '';

					const filteredCharacters = characters.map(({ server, name, level, breed }) => ({
						server,
						name,
						level,
						class: breed
					})).filter(c => c.server && c.name);

					return {
						characters: filteredCharacters,
						nickname
					};
					
				} catch (error) {
					return null;
				}
			}
		});

		return result?.result || null;
		
	} catch (error) {
		console.error('Erreur d\'extraction :', error);
		return null;
	}
}

(async () => {
	const extracted = await extractCharacters();

	if (!extracted || !extracted.characters?.length) {
		showError();
		return;
	}

	extractedData = extracted.characters;
	extractedNickname = extracted.nickname;

	messageEl.style.display = "none";
	submitBtn.style.display = "block";
})();

submitBtn.addEventListener("click", () => {
	if (!extractedData) return;

	const formData = new FormData();
	formData.append('charactersJson', JSON.stringify(extractedData));
	formData.append('characterWhois', extractedNickname);

	const form = document.createElement('form');
	form.method = 'POST';
	form.action = 'https://www.halles-des-douze.fr/utilisateurs/mon-profil/importer-mes-personnages';
	form.target = '_blank';
	form.style.display = 'none';

	for (const [name, value] of formData) {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = value;
		form.appendChild(input);
	}

	document.body.appendChild(form);
	form.submit();
	form.remove();
});