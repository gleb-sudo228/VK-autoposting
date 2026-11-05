
const APP_ID = 54746009;

const status = document.getElementById("status");
const authorize = document.getElementById("authorize");
const download = document.getElementById("download");

let resultText = "";

vkBridge.send("VKWebAppInit");

authorize.addEventListener("click", async () => {
    try {
        status.textContent = "Ожидание подтверждения VK...";

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
    link.click();

    URL.revokeObjectURL(url);
});
