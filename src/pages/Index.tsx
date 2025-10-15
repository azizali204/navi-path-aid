import { useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { MilitaryMap } from "@/components/military/MilitaryMap";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return <MilitaryMap />;
};

export default Index;
