function extract() {
    try {
        const el = document.querySelector("update-character-account");
        const characters = JSON.parse(el?.getAttribute("data-characters") || '[]');
        const nickname = document.querySelector(".nickname")?.textContent.trim() || '';
        const filtered = characters
            .map(({ server, name, level, breed }) => ({ server, name, level, class: breed }))
            .filter(c => c.server && c.name);
        return { status: "ok", characters: filtered, nickname };
    } catch {
        return { status: "unexpected_error" };
    }
}

const result = extract();
chrome.runtime.sendMessage({ type: "EXTRACTION_RESULT", payload: result });