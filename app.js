
const VK_APP_ID = 54746009;

const LOCAL_RECEIVER_URL =
    "http://127.0.0.1:8765/receive-token";


const button = document.getElementById("authButton");
const statusBox = document.getElementById("status");
const codeInput = document.getElementById("pairingCode");


function setStatus(message) {
    statusBox.textContent = message;
}


function getGrantedScopes(scopeValue) {
    if (Array.isArray(scopeValue)) {
        return scopeValue.map(item => String(item).trim());
    }

    if (typeof scopeValue === "string") {
        return scopeValue
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


async function authorize() {
    const pairingCode = codeInput.value.trim();

    if (!pairingCode) {
        setStatus("Сначала введи одноразовый код из Terminal.");
        return;
    }

    if (!window.vkBridge) {
        setStatus(
            "VK Bridge не обнаружен. Открой Mini App внутри VK. " +
            "Если авторизация недоступна, используй ввод токена " +
            "через Terminal."
        );
        return;
    }

    button.disabled = true;
    setStatus("Запрашиваю разрешения VK...");

    try {
        // Инициализация VK Bridge.
        await window.vkBridge.send("VKWebAppInit", {});

        // Запрашиваем пользовательский токен и два необходимых права.
        const authResult = await window.vkBridge.send(
            "VKWebAppGetAuthToken",
            {
                app_id: VK_APP_ID,
                scope: "wall,photos"
            }
        );

        const accessToken = authResult.access_token;

        const scopes = getGrantedScopes(authResult.scope);

        if (!accessToken) {
            throw new Error("VK не передал пользовательский токен.");
        }

        const requiredScopes = ["wall", "photos"];

        const missingScopes = requiredScopes.filter(
            scope => !scopes.includes(scope)
        );

        if (missingScopes.length > 0) {
            throw new Error(
                "Не получены необходимые права: " +
                missingScopes.join(", ") +
                ". Разреши права wall и photos при авторизации."
            );
        }

        setStatus("Разрешения получены. Передаю токен локальному боту...");

        // Передача происходит на localhost, а не на внешний сервер.
        const response = await fetch(
            LOCAL_RECEIVER_URL,
            {
                method: "POST",
                mode: "cors",
                credentials: "omit",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code: pairingCode,
                    access_token: accessToken,
                    scope: scopes
                })
            }
        );

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                "Локальная программа вернула некорректный ответ."
            );
        }

        if (!response.ok || !result.ok) {
            throw new Error(
                result.message || "Локальная авторизация не удалась."
            );
        }

        // Не выводим токен, не сохраняем его в браузере.
        codeInput.value = "";

        setStatus(
            "Авторизация успешно передана локальному боту. " +
            "Вернись в Terminal."
        );

    } catch (error) {
        setStatus(
            "Ошибка авторизации:\n" + error.message
        );

    } finally {
        button.disabled = false;
    }
}


button.addEventListener("click", authorize);