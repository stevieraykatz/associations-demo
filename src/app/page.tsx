"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createBaseAccountSDK } from "@base-org/account";
import { useResolveAssociations } from "@/hooks/useResolveAssociations";
import { useVerifyAssociationSignature } from "@/hooks/useVerifyAssociationSignature";

interface WalletConnectResponse {
  accounts: Array<{
    address: string;
    capabilities?: {
      profileInfo?: {
        name?: string;
      };
    };
  }>;
  chainIds: string[];
}

function App() {
  const [provider, setProvider] = useState<{
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  } | null>(null);
  const [connectedAccount, setConnectedAccount] =
    useState<WalletConnectResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    resolveAssociations,
    isLoading: isResolving,
    data: associationsData,
  } = useResolveAssociations();

  const {
    verifySignature,
    isVerifying,
    result: verificationResult,
  } = useVerifyAssociationSignature();

  // Initialize SDK
  useEffect(() => {
    const sdkInstance = createBaseAccountSDK({
      preference: {
        walletUrl: "http://localhost:3005/connect",
      },
      subAccounts: {
        creation: "on-connect",
        defaultAccount: "sub",
        funding: "manual",
      },
    });

    setProvider(sdkInstance.getProvider());
  }, []);

  const handleConnect = async () => {
    if (!provider) return;

    setIsConnecting(true);
    setError(null);

    try {
      const result = (await provider.request({
        method: "wallet_connect",
        params: [{ version: "1" }],
      })) as WalletConnectResponse;

      console.log("Connect result:", result);
      setConnectedAccount(result);

      // Check for profile name and resolve associations
      const profileName =
        result?.accounts?.[0]?.capabilities?.profileInfo?.name;
      if (profileName) {
        console.log("Found profile name:", profileName);
        await resolveAssociations({ name: profileName });
      } else {
        console.log("No profile name found in response");
      }
    } catch (err) {
      console.error("Connect error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnectedAccount(null);
    setError(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        <div>
          <h2>Account</h2>

          {connectedAccount && (
            <div>
              status: connected
              <br />
              address: {connectedAccount.accounts[0]?.address}
              <br />
              chainIds: {JSON.stringify(connectedAccount.chainIds)}
              <br />
              profile name:{" "}
              {connectedAccount.accounts[0]?.capabilities?.profileInfo?.name ||
                "N/A"}
            </div>
          )}

          {!connectedAccount && <div>status: disconnected</div>}

          {connectedAccount && (
            <button type="button" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>

        <div>
          <h2>Connect</h2>
          <button
            type="button"
            onClick={handleConnect}
            disabled={!provider || isConnecting || !!connectedAccount}
          >
            {isConnecting ? "Connecting..." : "Connect Base Account"}
          </button>

          {error && <div style={{ color: "red" }}>Error: {error}</div>}
        </div>

        <div>
          <h2>Associations</h2>
          {isResolving && <div>Resolving associations...</div>}
          {associationsData && (
            <div>
              <h3>Associations for {associationsData.name}</h3>
              <div>
                <strong>Forward Resolved Address:</strong>{" "}
                {associationsData.forwardResolvedAddress}
              </div>
              <div>
                <strong>Associations URL:</strong>{" "}
                {associationsData.associationsUrl}
              </div>
              <div>
                <strong>Has Matching Association:</strong>{" "}
                <span
                  style={{
                    color: associationsData.hasMatchingAssociation
                      ? "green"
                      : "red",
                  }}
                >
                  {associationsData.hasMatchingAssociation
                    ? "✓ TRUE"
                    : "✗ FALSE"}
                </span>
              </div>

              {associationsData.associationsData &&
                associationsData.associationsData.associations.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h4>Verify Signature</h4>
                    {associationsData.associationsData.associations.map(
                      (assoc) => (
                        <div key={assoc.id} style={{ marginBottom: "10px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (associationsData.forwardResolvedAddress) {
                                verifySignature({
                                  association: assoc,
                                  expectedSigner:
                                    associationsData.forwardResolvedAddress,
                                });
                              }
                            }}
                            disabled={isVerifying}
                          >
                            Verify Association #{assoc.id}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

              {isVerifying && <div>Verifying signature...</div>}
              {verificationResult && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: verificationResult.isValid
                      ? "#d4edda"
                      : "#f8d7da",
                    borderRadius: "5px",
                  }}
                >
                  <strong>Signature Verification:</strong>{" "}
                  <span
                    style={{
                      color: verificationResult.isValid ? "green" : "red",
                    }}
                  >
                    {verificationResult.isValid ? "✓ VALID" : "✗ INVALID"}
                  </span>
                  <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
                    <div>Recovered: {verificationResult.recoveredSigner}</div>
                    <div>Expected: {verificationResult.expectedSigner}</div>
                  </div>
                </div>
              )}

              <details>
                <summary>Full Data</summary>
                <pre>{JSON.stringify(associationsData, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          width: "2px",
          backgroundColor: "#ccc",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          padding: "20px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Image
          src="/images/blockdiagram.png"
          alt="Demo screenshot"
          fill
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}

export default App;
