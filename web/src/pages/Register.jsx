import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { BeatLoader } from "react-spinners";
import { UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    role: "public",
    govtId: "",
    schoolName: "",
    registrationNumber: "",
    organization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    try {
      setError("");
      setLoading(true);
      const userData = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === "government" && { govtId: formData.govtId }),
        ...(formData.role === "school" && {
          schoolName: formData.schoolName,
          registrationNumber: formData.registrationNumber,
        }),
        ...(formData.role === "ngo" && { organization: formData.organization }),
      };
      await register(formData.email, formData.password, userData);
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to create account");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="w-full border border-[#4F7EC1]/20 shadow-xl bg-white/80 backdrop-blur">
      <CardHeader className="pb-2 space-y-2">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#4F7EC1]/10 text-[#4F7EC1]">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-center text-xl font-bold">
            Create an account
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Please fill in the details below
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5 md:col-span-2">
              <Label className="text-sm font-medium">Select Role</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(value) =>
                  handleChange({ target: { name: "role", value } })
                }
              >
                <SelectTrigger className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1] bg-white">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="public">Public User</SelectItem>
                  <SelectItem value="ngo">NGO/Volunteer</SelectItem>
                  <SelectItem value="school">School Administrator</SelectItem>
                  <SelectItem value="government">
                    Government Official
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personal Information */}
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Email Address</Label>
              <Input
                className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Fields */}
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Password</Label>
              <Input
                className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Confirm Password</Label>
              <Input
                className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Role-specific Fields */}
            {formData.role === "government" && (
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-sm font-medium">Government ID</Label>
                <Input
                  className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                  name="govtId"
                  placeholder="Enter your government ID"
                  value={formData.govtId}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {formData.role === "school" && (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-sm font-medium">School Name</Label>
                  <Input
                    className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                    name="schoolName"
                    placeholder="Enter school name"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm font-medium">Registration ID</Label>
                  <Input
                    className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                    name="registrationNumber"
                    placeholder="School registration number"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {formData.role === "ngo" && (
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-sm font-medium">Organization Name</Label>
                <Input
                  className="h-9 border-[#4F7EC1]/40 focus:ring-[#4F7EC1]"
                  name="organization"
                  placeholder="Enter organization name (Optional)"
                  value={formData.organization}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          type="submit"
          onClick={handleSubmit}
          variant="outline"
          className="w-full h-10 bg-[#4F7EC1] hover:bg-[#4F7EC1]/90 border-[#4F7EC1] shadow-md transition-colors text-white font-medium"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <BeatLoader size={8} color="white" />
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
