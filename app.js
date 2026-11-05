const APP_ID = 54746009;

const SERVER_URL =
    "http://127.0.0.1:8765/receive-token";

const statusElement =
    document.getElementById("status");

const authorizeButton =
    document.getElementById("authorize");

const pairingCodeInput =
    document.getElementById("pairingCode");


async function initializeApp() {
    try {
        await vkBridge.send("VKWebAppInit");

        statusElement.textContent =
            "Mini App готово. Введи одноразовый код.";

    } catch (error) {
        statusElement.textContent =
            "Ошибка инициализации VK: " + error.message;
    }
}


initializeApp();


authorizeButton.addEventListener("click", async () => {

    const pairingCode =
        pairingCodeInput.value.trim();

    if (!pairingCode) {
        statusElement.textContent =
            "Сначала введи одноразовый код из Python.";

        return;
    }

    authorizeButton.disabled = true;

    let accessToken = null;

    try {

        statusElement.textContent =
            "Ожидание подтверждения VK...";

        // Запрашиваем пользовательский токен VK
        const authResult = await vkBridge.send(
            "VKWebAppGetAuthToken",
            {
                app_id: APP_ID,
                scope: "wall,photos"
            }
        );

        accessToken = authResult.access_token;

        if (!accessToken) {
            throw new Error(
                "VK не вернул токен авторизации."
            );
        }

        // Проверяем выданные разрешения
        const grantedScopes = String(
            authResult.scope || ""
        )
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

        const requiredScopes = ["wall", "photos"];

        const missingScopes = requiredScopes.filter(
            scope => !grantedScopes.includes(scope)
        );

        if (missingScopes.length > 0) {
            throw new Error(
                "Не предоставлены необходимые разрешения: " +
                missingScopes.join(", ")
            );
        }

        statusElement.textContent =
            "Разрешения получены. Передаём данные Python-боту...";

        // Передаём токен локальному серверу
        const response = await fetch(SERVER_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                code: pairingCode,
                access_token: accessToken,
                scope: grantedScopes
            })
        });

        if (!response.ok) {
            throw new Error(
                "Локальный сервер ответил с ошибкой HTTP " +
                response.status
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message || "Сервер не подтвердил авторизацию."
            );
        }

        statusElement.textContent =
            "Авторизация успешно передана Python-боту. " +
            "Можно вернуться в Terminal.";

        pairingCodeInput.value = "";

    } catch (error) {

        statusElement.textContent =
            "Ошибка авторизации: " + error.message;

    } finally {

        // Не сохраняем токен в интерфейсе
        accessToken = null;

        authorizeButton.disabled = false;
    }

});
