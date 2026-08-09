import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post<LoginResponse>(
        "/auth/login",
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      // Save authentication information
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Go to dashboard
      navigate("/", { replace: true });

    } catch (error: any) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">

        {/* Left side */}

        <div className="relative hidden overflow-hidden bg-gray-950 lg:flex">

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">

            <div>
              <div className="text-2xl font-semibold tracking-tight text-white">
                FundsRoom
              </div>

              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                ERP Platform
              </div>
            </div>

            <div className="max-w-xl">

              <div className="mb-5 h-px w-12 bg-gray-600" />

              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                Everything your business needs,
                <span className="block text-gray-500">
                  in one place.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-6 text-gray-400">
                Manage customers, inventory and sales
                operations from a single workspace.
              </p>

            </div>

            <div className="text-xs text-gray-600">
              FundsRoom ERP · Internal Business Platform
            </div>

          </div>

        </div>

        {/* Login */}

        <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 sm:px-12">

          <div className="mx-auto w-full max-w-sm">

            <div className="mb-12 lg:hidden">

              <div className="text-2xl font-semibold tracking-tight text-gray-950">
                FundsRoom
              </div>

              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                ERP Platform
              </div>

            </div>

            <div className="mb-9">

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                Welcome back
              </p>

              <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
                Sign in to your account
              </h2>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                Enter your credentials to access the ERP.
              </p>

            </div>

            {error && (
              <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="admin@fundsroom.com"
                    autoComplete="email"
                    className="h-11 w-full border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-11 w-full border border-gray-300 bg-white pl-10 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-gray-950 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

            </form>

            <p className="mt-10 text-center text-xs text-gray-400">
              Authorized personnel only
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}