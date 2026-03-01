importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyCw38sezt3TWmFIuUXFD3mPAj2ZPF6ZD4o",
    authDomain: "gerenciador-eeb96.firebaseapp.com",
    databaseURL: "https://gerenciador-eeb96-default-rtdb.firebaseio.com",
    projectId: "gerenciador-eeb96",
    storageBucket: "gerenciador-eeb96.appspot.com",
    messagingSenderId: "560345055072",
    appId: "1:560345055072:web:9048475b7ac90a7f43e805"
});

const messaging = firebase.messaging();

/*
 🔥 IMPORTANTE
 Quando a mensagem vem com o campo `notification`, o Firebase JÁ exibe
 automaticamente a notificação. NÃO podemos chamar showNotification(),
 senão aparecerá DUPLICADA.
*/
messaging.onBackgroundMessage(payload => {
    console.log("📩 Mensagem FCM recebida em segundo plano:", payload);

    // Só exibe notificação manual se o payload NÃO tiver notification
    if (!payload.notification) {
        const notificationTitle = payload.data?.title || "Nova mensagem";
        const notificationOptions = {
            body: payload.data?.body || "",
            icon: "/img/icon192.png",
            badge: "/img/icon192.png",
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});