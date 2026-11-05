const APP_ID = 54746009;

const status = document.getElementById("status");
const authorize = document.getElementById("authorize");
const download = document.getElementById("download");

let resultText = "";

async function initializeApp() {
    try {
        await vkBridge.send("VKWebAppInit");
        status.textContent = "Приложение VK готово.";
    } catch (error) {
        status.textContent =
            "Ошибка инициализации: " + error.message;
    }
}

initializeApp();

authorize.addEventListener("click", async () => {
    try {
        status.textContent = "Ожидание подтверждения VK...";
        authorize.disabled = true;

        const user = await vkBridge.send(
            "VKWebAppGetUserInfo"
        );

        resultText =
            "VK Mini App authorization\n" +
            "Application ID: " + APP_ID + "\n" +
            "User ID: " + user.id + "\n" +
            "Name: " + user.first_name + " " +
            user.last_name + "\n" +
            "Status: Authorized";

        status.textContent =
            "Авторизация подтверждена.";

        download.hidden = false;

    } catch (error) {
        status.textContent =
            "Ошибка: " + error.message;
    } finally {
        authorize.disabled = false;
    }
});

download.addEventListener("click", () => {
    const blob = new Blob(
        [resultText],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "vk_authorization.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
