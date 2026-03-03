// frontend/src/pages/Login.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../useAuth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginFormValues) => {
    // Check network status first
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }
    
    setLoading(true);
    try {
      const loggedInUser = await login(data.email, data.password);
      toast.success("Welcome back!");
      if (loggedInUser.role === 'brand') {
        navigate("/brand/dashboard");
      } else if (loggedInUser.role === 'influencer') {
        navigate("/influencer/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setLoading(false);
      console.log("Login error:", err); // For debugging
      
      // Show specific error messages based on the error
      if (err.message === "Invalid credentials") {
        setError("password", {
          type: "manual",
          message: "Incorrect email or password"
        });
        toast.error("Incorrect email or password");
      } else if (err.message.includes("Network error") || err.message.includes("timeout")) {
        toast.error("Connection problem. Please check your internet and try again.");
      } else {
        // For any other authentication error
        setError("password", {
          type: "manual",
          message: "Incorrect email or password"
        });
        toast.error("Incorrect email or password");
      }
    }
  };

  // Explicitly handle form submission to prevent default behavior
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-gray-900 px-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">
          Login to Your Account
        </h1>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <input
              {...register("email", { required: "Email is required" })}
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="relative">
            <input
              {...register("password", { required: "Password is required" })}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-400 focus:outline-none"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && (
              <p className="mt-1 text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg text-white font-medium bg-primary hover:bg-primary-dark transition duration-200 shadow hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
