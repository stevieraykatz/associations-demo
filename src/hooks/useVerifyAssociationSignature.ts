import { useState } from "react";
import { verifyMessage } from "viem";

interface Association {
  id: number;
  initiatorAddress: string;
  approverAddress: string;
  initiatorBytes: string;
  approverBytes: string;
  interfaceId: string;
  data: string;
  validAt: number;
  revokedAt: number | null;
  initiatorSignature: string;
  createdAt: string;
  isActive: boolean;
}

interface VerifyParams {
  association: Association;
  expectedSigner: string;
}

interface VerificationResult {
  isValid: boolean;
  recoveredSigner: string;
  expectedSigner: string;
}

export function useVerifyAssociationSignature() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifySignature = async ({
    association,
    expectedSigner,
  }: VerifyParams) => {
    setIsVerifying(true);
    setError(null);

    try {
      // Reconstruct the message that was signed
      // The initiatorBytes contains the message that was signed
      const message = association.initiatorBytes;
      const signature = association.initiatorSignature as `0x${string}`;

      // Verify the signature
      const isValid = await verifyMessage({
        address: expectedSigner as `0x${string}`,
        message,
        signature,
      });

      const verificationResult: VerificationResult = {
        isValid,
        recoveredSigner: association.initiatorAddress,
        expectedSigner,
      };

      setResult(verificationResult);
      return verificationResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Signature verification error:", error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifySignature,
    isVerifying,
    error,
    result,
  };
}
