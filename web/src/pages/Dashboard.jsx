import { useAuth } from "../contexts/AuthContext";
import PublicDashboard from "./PublicDashboard";
import NGODashboard from "./NGODashboard";
import SchoolDashboard from "./SchoolDashboard";
import GovernmentDashboard from "./GovernmentDashboard";
import { HashLoader } from "react-spinners";

export default function Dashboard() {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F5F5F5]">
        <div className="text-center space-y-4">
          <HashLoader color="#4F7EC1" size={50} speedMultiplier={0.9} />
          {/* <p className="text-gray-600 mt-4">
            {loading ? "Loading..." : "Please wait..."}
          </p> */}
        </div>
      </div>
    );
  }

  switch (userProfile.role) {
    case "public":
      return <PublicDashboard />;
    case "ngo":
    case "volunteer":
      return <NGODashboard />;
    case "school":
      return <SchoolDashboard />;
    case "government":
      return <GovernmentDashboard />;
    default:
      return (
        <div className="min-h-screen grid place-items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Unknown role</h2>
            <p className="text-gray-600">Please contact support</p>
          </div>
        </div>
      );
  }
}
