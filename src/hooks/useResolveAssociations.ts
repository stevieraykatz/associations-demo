import { useState } from 'react'
import { usePublicClient } from 'wagmi'
import { normalize } from 'viem/ens'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

interface ResolveAssociationsParams {
  name: string
}

interface Association {
  id: number
  initiatorAddress: string
  approverAddress: string
  initiatorBytes: string
  approverBytes: string
  interfaceId: string
  data: string
  validAt: number
  revokedAt: number | null
  initiatorSignature: string
  createdAt: string
  isActive: boolean
}

interface AssociationsResponse {
  account: {
    address: string
    createdAt: string
  }
  associations: Association[]
}

interface ResolveResult {
  name: string
  forwardResolvedAddress: string | null
  associationsUrl: string | null
  associationsData: AssociationsResponse | null
  hasMatchingAssociation: boolean
}

export function useResolveAssociations() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<ResolveResult | null>(null)

  const resolveAssociations = async ({ name }: ResolveAssociationsParams) => {
    setIsLoading(true)
    setError(null)

    const publicClient = createPublicClient({
      transport: http(),
      chain: mainnet
    })

    try {
      console.log('Resolving associations for:', name)
      
      if (!publicClient) {
        throw new Error('Public client not available')
      }

      const normalizedName = normalize(name)
      console.log('Normalized name:', normalizedName)

      const forwardResolvedAddress = await publicClient.getEnsAddress({
        name: normalizedName,
      })
      console.log('Forward resolved address:', forwardResolvedAddress)

      if (!forwardResolvedAddress) {
        throw new Error(`Could not resolve address for ${name}`)
      }

      const associationsUrl = await publicClient.getEnsText({
        name: normalizedName,
        key: 'associations-url',
        universalResolverAddress: '0x426fA03fB86E510d0Dd9F70335Cf102a98b10875'
      })
      console.log('Associations URL:', associationsUrl)

      if (!associationsUrl) {
        throw new Error(`No associations-url text record found for ${name}`)
      }

      const response = await fetch(associationsUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch associations: ${response.statusText}`)
      }

      const associationsData: AssociationsResponse = await response.json()
      console.log('Associations data:', associationsData)

      const hasMatchingAssociation = associationsData.associations.some(
        (association) =>
          association.initiatorAddress.toLowerCase() === forwardResolvedAddress.toLowerCase() ||
          association.approverAddress.toLowerCase() === forwardResolvedAddress.toLowerCase()
      )

      console.log('Has matching association:', hasMatchingAssociation)

      const result: ResolveResult = {
        name,
        forwardResolvedAddress,
        associationsUrl,
        associationsData,
        hasMatchingAssociation,
      }
      
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    resolveAssociations,
    isLoading,
    error,
    data,
  }
}

