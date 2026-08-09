import axios from "axios";

const api = axios.create({
  baseURL: "https://fundsroom-erp-api-gohl.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
| Automatically attach JWT to every API request.
*/

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
| 401 → authentication problem
| 403 → permission problem
*/

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    /*
    |--------------------------------------------------------------------------
    | 401 UNAUTHORIZED
    |--------------------------------------------------------------------------
    */

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Avoid redirecting repeatedly
      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 403 FORBIDDEN
    |--------------------------------------------------------------------------
    */

    if (status === 403) {
      console.warn(
        "Permission denied:",
        error.response?.data?.message ||
          "You do not have permission to perform this action."
      );
    }

    return Promise.reject(error);
  }
);

export default api;