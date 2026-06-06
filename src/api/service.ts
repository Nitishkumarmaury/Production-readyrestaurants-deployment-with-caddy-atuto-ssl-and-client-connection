import axios from "axios";
import { destroyCookie, parseCookies } from "nookies";

// // dev server
// export const API_ROOT = import.meta.env.VITE_DEV_API_URL;

//live server
export const API_ROOT = import.meta.env.VITE_API_URL || "";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const service = axios.create({
    baseURL: API_ROOT,
    headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        "ngrok-skip-browser-warning": "true",
        timezone,
    },
});

service.defaults.timeout = 100000;

const cancelTokenSources: { [key: string]: any } = {};

service.interceptors.request.use(
    (config) => {
        const requestUrl = config.url;
        // if (requestUrl && cancelTokenSources[requestUrl]) {
        //   cancelTokenSources[requestUrl].cancel(`Canceled previous request to ${requestUrl}`);
        // }

        const source = axios.CancelToken.source();
        config.cancelToken = source.token;
        cancelTokenSources[requestUrl!] = source;
        const isFormData = config.data instanceof FormData;
        if (!isFormData) {
            config.headers["Content-Type"] = "application/json";
        }
        const tokenFromUrl =
            typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("token")
                : null;
        const authToken =
            tokenFromUrl ||
            parseCookies()["cookies_user_access_token"] ||
            parseCookies()["cookies_user_access_token_temp"];
        if (authToken && authToken !== "undefined" && authToken !== "null") {
            config.headers.Authorization = `Bearer ${authToken}`;
        } else {
            delete config.headers.Authorization;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

service.interceptors.response.use(
    (response) => {
        const isGetRequest = response.config.method === "get";
        const requestUrl = response.config.url;
        if (requestUrl) delete cancelTokenSources[requestUrl];
        return response.data;
    },
    (error) => {
        if (axios.isCancel(error)) {
            console.log("Request canceled:", error.message);
        }

        const { status, data } = error.response || {};

        // Global error message extraction
        if (data) {
            if (data.error_description) {
                error.message = data.error_description;
            } else if (data.error_code) {
                error.message = data.error_code;
            } else if (data.message) {
                error.message = data.message;
            }
        }

        if (status === 401) {
            sessionStorage.clear();
            localStorage.clear();
            destroyCookie(null, "cookies_user_access_token", { path: "/" });
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("unauthorized"));
            }
        }

        return Promise.reject(error);
    },
);

export default service;
