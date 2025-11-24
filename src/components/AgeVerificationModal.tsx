import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const AGE_VERIFICATION_KEY = "age_verified";

export const AgeVerificationModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem(AGE_VERIFICATION_KEY);
    if (!isVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = (isOfAge: boolean) => {
    if (isOfAge) {
      localStorage.setItem(AGE_VERIFICATION_KEY, "true");
      setIsOpen(false);
    } else {
      window.location.href = "https://www.google.com";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Age Verification Required</DialogTitle>
          <DialogDescription className="text-center pt-2">
            You must be 18 years or older to access this website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Legal Disclaimer:</p>
            <p>
              This website sells vaping and smoking products that are intended for adults only. 
              By entering this site, you confirm that you are of legal smoking age in your jurisdiction 
              and agree to be age verified.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Are you 18 years of age or older?
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleVerify(false)}
            className="w-full sm:w-auto"
          >
            No, I'm Under 18
          </Button>
          <Button
            onClick={() => handleVerify(true)}
            className="w-full sm:w-auto"
          >
            Yes, I'm 18 or Older
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
