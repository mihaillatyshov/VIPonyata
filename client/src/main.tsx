import "bootstrap-icons/font/bootstrap-icons.min.css";
import "bootstrap/scss/bootstrap.scss";
import "./assets/scss/index.scss";

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import store from "./redux/store";
import reportWebVitals from "./reportWebVitals";

// После деплоя у открытой вкладки старые чанки страниц пропадают с сервера — перезагружаем страницу один раз.
const CHUNK_RELOAD_KEY = "chunkReloadAt";
window.addEventListener("vite:preloadError", (event) => {
    try {
        const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
        if (Date.now() - lastReload < 10_000) {
            return;
        }
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    } catch {
        return;
    }
    event.preventDefault();
    window.location.reload();
});

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
