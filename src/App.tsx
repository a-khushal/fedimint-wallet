import { useCallback, useEffect, useState } from 'react'
import { wallet } from './wallet'
import { ClipboardCopy, Wallet, Zap, Download, Send } from 'lucide-react'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Expose the wallet to the global window object for testing
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

    return () => {
      unsubscribe()
    }
  }, [checkIsOpen])

  return balance
}

const App = () => {
  const { open, checkIsOpen } = useIsOpen()
  const balance = useBalance(checkIsOpen)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Fedimint Typescript Library Demo
          </h1>
        </header>

        <main className="space-y-8">
          <WalletStatus open={open} checkIsOpen={checkIsOpen} balance={balance} />
          <JoinFederation open={open} checkIsOpen={checkIsOpen} />
          <GenerateLightningInvoice />
          <RedeemEcash />
          <SendLightning />
        </main>
      </div>
    </div>
  )
}

const WalletStatus = ({
  open,
  checkIsOpen,
  balance,
}: {
  open: boolean
  checkIsOpen: () => void
  balance: number
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Wallet Status</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <strong className="text-gray-400">Is Wallet Open?</strong>
          <div className="flex items-center gap-4">
            <span className={`${open ? 'text-green-400' : 'text-red-400'}`}>
              {open ? 'Yes' : 'No'}
            </span>
            <button
              onClick={() => checkIsOpen()}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm transition-colors cursor-pointer"
            >
              Check
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <strong className="text-gray-400">Balance:</strong>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono text-blue-400">{balance}</span>
            <span className="text-gray-500">sats</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const JoinFederation = ({
  open,
  checkIsOpen,
}: {
  open: boolean
  checkIsOpen: () => void
}) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [joinResult, setJoinResult] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const joinFederation = async (e: React.FormEvent) => {
    e.preventDefault()
    checkIsOpen()

    console.log('Joining federation:', inviteCode)
    try {
      setJoining(true)
      const res = await wallet.joinFederation(inviteCode)
      console.log('join federation res', res)
      setJoinResult('Joined!')
      setJoinError('')
    } catch (e: any) {
      console.log('Error joining federation', e)
      setJoinError(typeof e === 'object' ? e.toString() : (e as string))
      setJoinResult('')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Join Federation</h3>
      </div>
      <form onSubmit={joinFederation} className="space-y-4">
        <div className="flex gap-4">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
            placeholder="Invite Code..."
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={open}
          />
          <button
            type="submit"
            disabled={open || joining}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors cursor-pointer"
          >
            {joining ? 'Joining...' : 'Join'}
          </button>
        </div>
        {!joinResult && open && (
          <i className="block text-gray-500">You've already joined a federation</i>
        )}
        {joinResult && (
          <div className="text-green-400 flex items-center gap-2">
            <span>✓</span> {joinResult}
          </div>
        )}
        {joinError && (
          <div className="text-red-400 flex items-center gap-2">
            <span>⚠</span> {joinError}
          </div>
        )}
      </form>
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
      const res = await wallet.mint.redeemEcash(ecashInput)
      console.log('redeem ecash res', res)
      setRedeemResult('Redeemed!')
      setRedeemError('')
    } catch (e) {
      console.log('Error redeeming ecash', e)
      setRedeemError(e as string)
      setRedeemResult('')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Redeem Ecash</h3>
      </div>
      <form onSubmit={handleRedeem} className="space-y-4">
        <div className="flex gap-4">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
            placeholder="Long ecash string..."
            required
            value={ecashInput}
            onChange={(e) => setEcashInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded font-medium transition-colors cursor-pointer"
          >
            Redeem
          </button>
        </div>
        {redeemResult && (
          <div className="text-green-400 flex items-center gap-2">
            <span>✓</span> {redeemResult}
          </div>
        )}
        {redeemError && (
          <div className="text-red-400 flex items-center gap-2">
            <span>⚠</span> {redeemError}
          </div>
        )}
      </form>
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
      setLightningResult('Paid!')
      setLightningError('')
    } catch (e) {
      console.log('Error paying lightning', e)
      setLightningError(e as string)
      setLightningResult('')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Pay Lightning</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
            placeholder="lnbc..."
            required
            value={lightningInput}
            onChange={(e) => setLightningInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded font-medium transition-colors cursor-pointer"
          >
            Pay
          </button>
        </div>
        {lightningResult && (
          <div className="text-green-400 flex items-center gap-2">
            <span>✓</span> {lightningResult}
          </div>
        )}
        {lightningError && (
          <div className="text-red-400 flex items-center gap-2">
            <span>⚠</span> {lightningError}
          </div>
        )}
      </form>
    </div>
  )
}

const GenerateLightningInvoice = () => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoice('')
    setError('')
    setGenerating(true)
    try {
      const response = await wallet.lightning.createInvoice(
        Number(amount),
        description,
      )
      setInvoice(response.invoice)
    } catch (e) {
      console.error('Error generating Lightning invoice', e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoice)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Generate Lightning Invoice</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-gray-400 mb-1">
              Amount (sats):
            </label>
            <input
              id="amount"
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
              placeholder="Enter amount"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-gray-400 mb-1">
              Description:
            </label>
            <input
              id="description"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
              placeholder="Enter description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={generating}
          className="w-full px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors cursor-pointer"
        >
          {generating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </form>
      <div className="mt-4 text-gray-400">
        mutinynet faucet:{' '}
        <a
          href="https://faucet.mutinynet.com/"
          target="_blank"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          https://faucet.mutinynet.com/
        </a>
      </div>
      {invoice && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <strong className="text-gray-400">Generated Invoice:</strong>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
            >
              <ClipboardCopy className="w-4 h-4" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-sm text-gray-300 break-all whitespace-pre-wrap">
            {invoice}
          </pre>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-400 flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  )
}

export default App