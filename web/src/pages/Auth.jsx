import React from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const Auth = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <section className="mx-auto w-full max-w-md px-4 py-14">
        <h1 className="text-center gradient-text text-3xl sm:text-4xl font-extrabold ">
          Login / Register
        </h1>
        <Tabs defaultValue="Login" className="mt-8 w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg border border-[#4F7EC1]/20 bg-[#4F7EC1]/10 text-[#4F7EC1] p-1">
            <TabsTrigger
              value="Login"
              className="rounded-md transition-colors font-medium text-[#4F7EC1] hover:bg-[#4F7EC1]/10 data-[state=active]:bg-[#4F7EC1] data-[state=active]:text-white"
            >
              <LogIn className="mr-2 h-4 w-4" /> Login
            </TabsTrigger>
            <TabsTrigger
              value="Register"
              className="rounded-md transition-colors font-medium text-[#4F7EC1] hover:bg-[#4F7EC1]/10 data-[state=active]:bg-[#4F7EC1] data-[state=active]:text-white"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Register
            </TabsTrigger>
          </TabsList>
          <TabsContent value="Login" className="mt-6">
            <Login />
          </TabsContent>
          <TabsContent value="Register" className="mt-6">
            <Register />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Auth;
