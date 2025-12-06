import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield } from "lucide-react";

export default function Setup2FA() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const { user, setup2FA, enable2FA } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (user.twoFactorEnabled) {
      toast({
        title: "2FA already enabled",
        description: "Two-factor authentication is already active on your account",
      });
      setLocation("/");
      return;
    }

    const initSetup = async () => {
      try {
        const data = await setup2FA();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Setup failed",
          description: error.message,
        });
        setLocation("/");
      } finally {
        setSetupLoading(false);
      }
    };

    initSetup();
  }, [user, setLocation, setup2FA, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (token.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid token",
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setLoading(true);

    try {
      await enable2FA(token);
      toast({
        title: "2FA enabled successfully",
        description: "Your account is now secured with two-factor authentication",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message,
      });
      setToken("");
    } finally {
      setLoading(false);
    }
  };

  if (setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Setting up 2FA...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-display">Setup Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {qrCode && (
              <img
                src={qrCode}
                alt="2FA QR Code"
                className="w-64 h-64 border-2 border-muted rounded-lg"
                data-testid="img-qr-code"
              />
            )}
            
            <div className="w-full space-y-2">
              <Label className="text-xs text-muted-foreground">
                Manual entry code (if you can't scan):
              </Label>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-xs break-all" data-testid="text-secret">
                  {secret}
                </code>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Enter verification code to confirm</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={token}
                  onChange={setToken}
                  data-testid="input-verification-token"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || token.length !== 6}
              data-testid="button-enable-2fa"
            >
              {loading ? "Enabling..." : "Enable 2FA"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setLocation("/")}
            className="w-full"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
