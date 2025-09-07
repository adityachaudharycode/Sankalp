import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to log in");
    }
    setLoading(false);
  };

  return (
    <div className=" grid place-items-center bg-gray-50">
      <Card className="w-full border border-[#4F7EC1]/20 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#4F7EC1]/10 text-[#4F7EC1]">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle className="text-center text-2xl font-extrabold">
            Login to your account
          </CardTitle>
          <p className="text-center text-sm text-gray-600 mt-1">
            Welcome back! Please enter your details.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  className="border-2 border-[#4F7EC1]/40 focus-visible:ring-[#4F7EC1]"
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  className="border-2 border-[#4F7EC1]/40 focus-visible:ring-[#4F7EC1]"
                  id="password"
                  type="password"
                  placeholder="*******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            onClick={handleSubmit}
            variant="outline"
            className="bg-[#4F7EC1] w-full hover:bg-[#4F7EC1]/90 border-[#4F7EC1] shadow-md transition-colors text-white"
            disabled={loading}
          >
            {loading ? <BeatLoader size={10} color="white" /> : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
