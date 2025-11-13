'use client'

import Image from 'next/image'
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi'
import { useResolveAssociations } from '@/hooks/useResolveAssociations'

interface WalletConnectResponse {
  accounts: Array<{
    address: string
    capabilities?: {
      profileInfo?: {
        name?: string
      }
    }
  }>
  chainIds: string[]
}

function App() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { data: walletClient } = useWalletClient()
  const { disconnect } = useDisconnect()
  const { resolveAssociations, isLoading: isResolving, data: associationsData } = useResolveAssociations()

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div>
          <h2>Account</h2>

          <div>
            status: {account.status}
            <br />
            addresses: {JSON.stringify(account.addresses)}
            <br />
            chainId: {account.chainId}
          </div>

          {account.status === 'connected' && (
            <button type="button" onClick={() => disconnect()}>
              Disconnect
            </button>
          )}
        </div>

        <div>
          <h2>Connect</h2>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
            >
              {connector.name}
            </button>
          ))}
          <div>{status}</div>
          <div>{error?.message}</div>
        </div>

        <div>
          <h2>Wallet Request</h2>
          <button
            type="button"
            disabled={!walletClient}
            onClick={async () => {
              if (!walletClient) return
              try {
                const result = await walletClient.request({
                  method: 'wallet_connect',
                  params: [{ version: '1' }],
                }) as WalletConnectResponse
                
                console.log('Wallet request result:', result)

                const profileName = result?.accounts?.[0]?.capabilities?.profileInfo?.name
                
                if (profileName) {
                  console.log('Found profile name:', profileName)
                  await resolveAssociations({ name: profileName })
                } else {
                  console.log('No profile name found in response')
                }
              } catch (err) {
                console.error('Wallet request error:', err)
              }
            }}
          >
            Trigger wallet_connect
          </button>
          
          {isResolving && <div>Resolving associations...</div>}
          {associationsData && (
            <div>
              <h3>Associations for {associationsData.name}</h3>
              <div>
                <strong>Forward Resolved Address:</strong> {associationsData.forwardResolvedAddress}
              </div>
              <div>
                <strong>Associations URL:</strong> {associationsData.associationsUrl}
              </div>
              <div>
                <strong>Has Matching Association:</strong>{' '}
                <span style={{ color: associationsData.hasMatchingAssociation ? 'green' : 'red' }}>
                  {associationsData.hasMatchingAssociation ? '✓ TRUE' : '✗ FALSE'}
                </span>
              </div>
              <details>
                <summary>Full Data</summary>
                <pre>{JSON.stringify(associationsData, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        width: '2px', 
        backgroundColor: '#ccc',
        flexShrink: 0
      }} />

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <img
          src="/images/blockdiagram.png"
          alt="Demo screenshot"
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}

export default App
