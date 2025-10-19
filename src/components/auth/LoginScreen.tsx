import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Anchor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginScreenProps {
  onLogin: () => void;
}

// DEMO ONLY — replace with server-side auth in production
// في الإنتاج: يجب نقل المصادقة إلى الخادم واستخدام JWT أو Session Tokens
const DEMO_CREDENTIALS = {
  username: "user",
  password: "Aa123456"
};

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEMO ONLY — في الواقع، يجب إرسال البيانات للخادم بشكل آمن عبر HTTPS
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام الخرائط البحرية",
      });
      onLogin();
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4 md:p-6" dir="rtl">
      <Card className="w-full max-w-md p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-card">
        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            <Anchor className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-foreground">
            نظام الخرائط البحرية العسكرية
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            نسخة تجريبية - Private Naval Map Demo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs sm:text-sm font-medium text-foreground">
              اسم المستخدم
            </label>
            <Input
              id="username"
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right h-10 sm:h-11"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground">
              كلمة المرور
            </label>
            <Input
              id="password"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right h-10 sm:h-11"
              dir="rtl"
            />
          </div>

          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base">
            تسجيل الدخول
          </Button>
        </form>
      </Card>
    </div>
  );
};
