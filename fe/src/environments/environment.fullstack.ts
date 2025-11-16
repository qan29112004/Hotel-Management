export const environment = {
    production: false,
    baseUrl: 'http://192.168.100.135:8000',
    mediaUrl: 'http://192.168.100.135:8000',
    keycloakUrl: 'https://portal-stag.duckdns.org',
    keycloakRealm: 'Portal-Dev',
    keycloakClientId: 'CMS-Portal-Dev',
    keycloakRedirectUri: 'http://localhost:4200/sign-in',
};

export const firebaseEnvironment = {
    firebaseConfig: {
        apiKey: 'AIzaSyDAVvRz0SO92odDzG6VH2tu0oJ6E4RwcGo',
        authDomain: 'fdi-chat.firebaseapp.com',
        projectId: 'fdi-chat',
        storageBucket: 'fdi-chat.firebasestorage.app',
        messagingSenderId: '601097463713',
        appId: '1:601097463713:web:0fd75330e3c17521854de0',
        measurementId: 'G-LB8D1XF885',
    },
};
