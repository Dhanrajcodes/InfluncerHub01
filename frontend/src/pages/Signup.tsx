// frontend/src/pages/Signup.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../useAuth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  role: "brand" | "influencer";
}

const Signup: React.FC = () => {
  const { register, handleSubmit, setError } = useForm<SignupFormValues>();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: SignupFormValues) => {
    // Check network status first
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }

    setLoading(true);
    try {
      const createdUser = await signup(data.name, data.email, data.password, data.role);
      toast.success("Account created!");
      if (createdUser.role === 'brand') {
        navigate("/brand/dashboard", { replace: true });
      } else if (createdUser.role === 'influencer') {
        navigate("/influencer/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setLoading(false);
      // Show specific error messages based on the error
      if (err.message === "User already exists") {
        setError("email", {
          type: "manual",
          message: "An account with this email already exists"
        });
        toast.error("An account with this email already exists");
      } else if (err.message.includes("Network error") || err.message.includes("timeout")) {
        toast.error("Connection problem. Please check your internet and try again.");
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
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
          Create Your Account
        </h1>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="Full Name"
            className="input w-full"
          />
          <input
            {...register("email", { required: "Email is required" })}
            type="email"
            placeholder="Email"
            className="input w-full"
          />
          <div className="relative">
            <input
              {...register("password", { 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              })}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="input w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-600 dark:text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Role selection */}
          <select 
            {...register("role", { required: "Please select a role" })} 
            className="input w-full"
          >
            <option value="">Select Role</option>
            <option value="brand">Brand</option>
            <option value="influencer">Influencer</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg text-white font-medium bg-primary hover:bg-primary-dark transition duration-200 shadow hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
