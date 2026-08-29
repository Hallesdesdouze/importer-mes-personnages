let extractedData = null;
let extractedNickname = '';

const statusEl = document.getElementById("status");
const statusIconEl = document.getElementById("statusIcon");
const statusTextEl = document.getElementById("statusText");
const successBar = document.getElementById("successBar");
const nicknameOut = document.getElementById("nicknameOut");
const countOut = document.getElementById("countOut");
const submitBtn = document.getElementById("submitBtn");

const ICONS = {
	loading: `<svg class="animate-spin w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>`,
	warning: `<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004.06 21h15.88a2 2 0 001.95-2.96L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
	error: `<svg class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M15 9l-6 6M9 9l6 6"/></svg>`,
};

const STYLES = {
	loading: "border-slate-200 bg-slate-100 text-slate-600",
	warning: "border-amber-200 bg-amber-50 text-amber-800",
	error: "border-red-200 bg-red-50 text-red-800",
};

function setStatus(type, html) {
	successBar.classList.add("hidden");
	successBar.classList.remove("flex");

	statusEl.className = `flex items-start gap-3 rounded-lg border p-3 text-xs leading-relaxed ${STYLES[type]}`;
	statusIconEl.innerHTML = ICONS[type];
	statusTextEl.innerHTML = html;
}

const showLoading = () => setStatus("loading", "Vérification de la page en cours…");

const showWrongPage = () => setStatus("warning",
	`Vous n'êtes pas sur la bonne page.\nRendez-vous sur la page <a href="https://store.ankama.com/fr/729-dofus/797-services/a-9987-transfert-de-personnage-vers-un-compte-dofus" target="_blank" class="underline font-medium">Transfert de personnage vers un compte Dofus</a> pour extraire vos personnages.`
);

const showErrorNotConnected = () => setStatus("error",
	"Vous n'êtes pas connecté à la boutique Dofus.\nConnectez-vous, puis rouvrez cette extension."
);

const showNoCharDetected = () => setStatus("warning",
	"Aucun personnage n'a été détecté sur cette page.\nVérifiez que votre compte possède bien des personnages et rafraîchissez la page."
);

const showUnexpectedError = () => setStatus("error",
	"Une erreur inattendue est survenue lors de l'extraction.\nRafraîchissez la page de la boutique et réessayez."
);

async function extractCharacters() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		if (!tab?.url?.includes('transfert-de-personnage-vers-un-compte')) {
			return { status: "wrong_page" };
		}

		const [result] = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				try {
					const el = document.querySelector("update-character-account");
					const characters = JSON.parse(el?.getAttribute("data-characters") || '[]');
					const nickname = document.querySelector(".nickname")?.textContent.trim() || '';

					const filteredCharacters = characters.map(({ server, name, level, breed }) => ({
						server,
						name,
						level,
						class: breed
					})).filter(c => c.server && c.name);

					return { characters: filteredCharacters, nickname };
				} catch (error) {
					return null;
				}
			}
		});

		if (!result?.result) return { status: "unexpected_error" };
		return { status: "ok", ...result.result };

	} catch (error) {
		console.error('Erreur d\'extraction :', error);
		return { status: "unexpected_error" };
	}
}

(async () => {
	showLoading();

	const extracted = await extractCharacters();

	if (extracted.status === "wrong_page") return showWrongPage();
	if (extracted.status === "unexpected_error") return showUnexpectedError();
	if (!extracted.nickname?.trim()) return showErrorNotConnected();
	if (!extracted.characters?.length) return showNoCharDetected();

	extractedData = extracted.characters;
	extractedNickname = extracted.nickname;

	statusEl.classList.add("hidden");
	nicknameOut.textContent = extractedNickname;
	countOut.textContent = extractedData.length;
	successBar.classList.remove("hidden");
	successBar.classList.add("flex");
})();

submitBtn.addEventListener("click", () => {
	if (!extractedData) return;

	const formData = new FormData();
	formData.append('charactersJson', JSON.stringify(extractedData));
	formData.append('characterWhois', extractedNickname);

	const form = document.createElement('form');
	form.method = 'POST';
	form.action = 'https://www.halles-des-douze.fr/profil/importer-mes-personnages';
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