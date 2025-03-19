import { useCallback, useEffect, useState } from 'react'
import { wallet } from './wallet'
import { Copy, ExternalLink } from 'lucide-react'

const TESTNET_FEDERATION_CODE = 'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// @ts-ignore
globalThis.wallet = wallet

const useIsOpen = () => {
  const [open, setIsOpen] = useState(false)
  const checkIsOpen = useCallback(() => {
    if (open !== wallet.isOpen()) {
      setIsOpen(wallet.isOpen())
    }
  }, [open])

  useEffect(() => {
    checkIsOpen()
  }, [checkIsOpen])

  return { open, checkIsOpen }
}

const useBalance = (checkIsOpen: () => void) => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const unsubscribe = wallet.balance.subscribeBalance((balance) => {
      checkIsOpen()
      setBalance(balance)
    })
    return () => unsubscribe()
  }, [checkIsOpen])

  return balance
}

const App = () => {
  const { open, checkIsOpen } = useIsOpen()
  const balance = useBalance(checkIsOpen)

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <WalletStatus open={open} checkIsOpen={checkIsOpen} balance={balance} />
        <JoinFederation open={open} checkIsOpen={checkIsOpen} />
        <GenerateLightningInvoice />
        <RedeemEcash />
        <SendLightning />
      </div>
    </div>
  )
}

const WalletStatus = ({ open, checkIsOpen, balance }: { open: boolean; checkIsOpen: () => void; balance: number }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Wallet Status</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Wallet Status</span>
          <div className="flex items-center gap-4">
            <span className={open ? 'text-green-400' : 'text-red-400'}>{open ? 'Open' : 'Closed'}</span>
            <button onClick={checkIsOpen} className="text-sm hover:cursor-pointer">Check</button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span>Balance</span>
          <span>{balance} sats</span>
        </div>
      </div>
    </div>
  )
}

const JoinFederation = ({ open, checkIsOpen }: { open: boolean; checkIsOpen: () => void }) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const joinFederation = async (e: React.FormEvent) => {
    e.preventDefault()
    checkIsOpen()
    try {
      setJoining(true)
      await wallet.joinFederation(inviteCode)
      setJoinResult('Successfully joined federation')
      setJoinError('')
    } catch (e: any) {
      setJoinError(typeof e === 'object' ? e.toString() : e)
      setJoinResult('')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Join Federation</h2>
      <form onSubmit={joinFederation} className="space-y-4">
        <input
          placeholder="Federation invite code..."
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          disabled={open}
        />
        <button type="submit" disabled={open || joining} className="w-full hover:cursor-pointer">
          {joining ? 'Joining...' : 'Join Federation'}
        </button>
      </form>
      {!joinResult && open && <p className="mt-2 text-gray-400 italic">Already joined a federation</p>}
      {joinResult && <div className="success">{joinResult}</div>}
      {joinError && <div className="error">{joinError}</div>}
    </div>
  )
}

const RedeemEcash = () => {
  const [ecashInput, setEcashInput] = useState('')
  const [redeemResult, setRedeemResult] = useState('')
  const [redeemError, setRedeemError] = useState('')

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await wallet.mint.redeemEcash(ecashInput)
      setRedeemResult('Successfully redeemed ecash')
      setRedeemError('')
      setEcashInput('')
    } catch (e) {
      setRedeemError(e as string)
      setRedeemResult('')
    }
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Redeem Ecash</h2>
      <form onSubmit={handleRedeem} className="space-y-4">
        <input
          placeholder="Enter ecash string..."
          value={ecashInput}
          onChange={(e) => setEcashInput(e.target.value)}
        />
        <button type="submit" className="w-full hover:cursor-pointer">Redeem Ecash</button>
      </form>
      {redeemResult && <div className="success">{redeemResult}</div>}
      {redeemError && <div className="error">{redeemError}</div>}
    </div>
  )
}

const SendLightning = () => {
  const [lightningInput, setLightningInput] = useState('')
  const [lightningResult, setLightningResult] = useState('')
  const [lightningError, setLightningError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await wallet.lightning.payInvoice(lightningInput)
      setLightningResult('Payment successful')
      setLightningError('')
      setLightningInput('')
    } catch (e) {
      setLightningError(e as string)
      setLightningResult('')
    }
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Pay Lightning Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Enter lightning invoice (lnbc...)"
          value={lightningInput}
          onChange={(e) => setLightningInput(e.target.value)}
        />
        <button type="submit" className="w-full hover:cursor-pointer">Pay Invoice</button>
      </form>
      {lightningResult && <div className="success">{lightningResult}</div>}
      {lightningError && <div className="error">{lightningError}</div>}
    </div>
  )
}

const GenerateLightningInvoice = () => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoice('')
    setError('')
    setGenerating(true)
    try {
      const response = await wallet.lightning.createInvoice(Number(amount), description)
      setInvoice(response.invoice)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Generate Lightning Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="number"
            placeholder="Amount (sats)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" disabled={generating} className="w-full hover:cursor-pointer">
          {generating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </form>
      
      <div className="mt-4 text-gray-400">
        <a href="https://faucet.mutinynet.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-200">
          Mutinynet Faucet <ExternalLink size={16} />
        </a>
      </div>

      {invoice && (
        <div className="success">
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="font-medium">Generated Invoice:</span>
            <button onClick={() => navigator.clipboard.writeText(invoice)} className="flex items-center gap-1 hover:cursor-pointer">
              <Copy size={16} /> Copy
            </button>
          </div>
          <pre className="invoice-wrap">{invoice}</pre>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default App