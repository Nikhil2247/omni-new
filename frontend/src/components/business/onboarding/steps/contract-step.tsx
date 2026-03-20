"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContractTermsCard } from "../../contract/contract-terms-card";
import { ContractSigningDialog } from "../../contract/contract-signing-dialog";
import { useOnboarding } from "../onboarding-context";
import { useBusinessContract, useGenerateContract } from "@/hooks/queries/use-business";
import { toast } from "sonner";
import {
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  FilePlus,
} from "lucide-react";

interface ContractStepProps {
  onComplete: () => void;
}

export function ContractStep({ onComplete }: ContractStepProps) {
  const { contract, hasContract, hasSignedContract, isLoading } = useOnboarding();
  const { refetch, isRefetching, error } = useBusinessContract();
  const { mutate: generateContract, isPending: isGenerating } = useGenerateContract();
  const vendorContract = contract?.contract;

  const handleGenerateContract = () => {
    generateContract(undefined, {
      onSuccess: (data) => {
        if (data?.hasContract) {
          toast.success("Contract generated successfully!");
          refetch();
        } else {
          toast.error((data as any)?.error || "Failed to generate contract");
        }
      },
      onError: (err: any) => {
        toast.error(err?.message || "Failed to generate contract");
      },
    });
  };

  // Loading state
  if (isLoading || isRefetching || isGenerating) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="text-muted-foreground mx-auto mb-4 h-12 w-12 animate-spin" />
          <h3 className="mb-2 font-semibold">
            {isGenerating ? "Generating Contract..." : "Loading Contract..."}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isGenerating
              ? "Please wait while we prepare your vendor agreement."
              : "Please wait while we fetch your contract details."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state (from query or response)
  const responseError = (contract as any)?.error;
  if (error || responseError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 font-semibold">Error Loading Contract</h3>
          <p className="text-muted-foreground mx-auto mb-4 max-w-md text-sm">
            {responseError ||
              (error as any)?.message ||
              "Failed to load contract. Please try again."}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleGenerateContract}>
              <FilePlus className="mr-2 h-4 w-4" />
              Generate Contract
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already signed
  if (hasSignedContract) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h3 className="mb-2 font-semibold">Contract Signed!</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            You&apos;ve signed the vendor agreement. You can view the terms anytime from your
            dashboard.
          </p>
          <Button onClick={onComplete}>Continue to Next Step</Button>
        </CardContent>
      </Card>
    );
  }

  // No contract created yet - show generate button
  if (!hasContract || !vendorContract) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FilePlus className="text-primary mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 font-semibold">Generate Your Contract</h3>
          <p className="text-muted-foreground mx-auto mb-4 max-w-md text-sm">
            Click the button below to generate your vendor agreement with the platform. This
            contract defines the commission rate and payout terms.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={handleGenerateContract} size="lg">
              <FilePlus className="mr-2 h-5 w-5" />
              Generate Contract
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Terms */}
      <ContractTermsCard contract={vendorContract} />

      {/* Sign Contract Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSignature className="text-primary h-5 w-5" />
            <CardTitle>Sign Your Contract</CardTitle>
          </div>
          <CardDescription>
            Review the terms above and sign to start receiving bookings on the platform.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              By signing, you agree to the commission rate and payout terms outlined in the
              contract. Make sure you&apos;ve read and understood all terms before signing.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex justify-end">
          <ContractSigningDialog
            contract={vendorContract}
            onComplete={onComplete}
            trigger={
              <Button size="lg">
                <FileSignature className="mr-2 h-5 w-5" />
                Review & Sign Contract
              </Button>
            }
          />
        </CardFooter>
      </Card>
    </div>
  );
}
