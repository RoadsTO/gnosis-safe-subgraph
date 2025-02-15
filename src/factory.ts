import { ProxyCreation } from '../generated/GnosisSafeProxyFactory/GnosisSafeProxyFactory'
import { GnosisSafe  } from '../generated/templates/GnosisSafe/GnosisSafe'
import { Wallet } from '../generated/schema'
import { GnosisSafe as GnosisSafeContract } from '../generated/templates'
import { log, Bytes, dataSource, Address } from '@graphprotocol/graph-ts'

export function handleProxyCreation(event: ProxyCreation): void {

  let walletAddr = event.params.proxy
  let safeInstance = GnosisSafe.bind(walletAddr)

  let callGetOwnerResult = safeInstance.try_getOwners()
  if(!callGetOwnerResult.reverted) {
    let wallet = new Wallet(walletAddr.toHex())
    wallet.creator             = event.transaction.from
    wallet.network             = dataSource.network()
    wallet.stamp               = event.block.timestamp
    wallet.hash                = event.transaction.hash
    wallet.factory             = event.address as Address
    wallet.owners              = callGetOwnerResult.value as Bytes[]
    wallet.threshold           = safeInstance.getThreshold()
    wallet.transactions        = []
    wallet.save()
  
    // Instanciate a new datasource
    GnosisSafeContract.create(walletAddr)
    
  } else {
    // A wallet can be instanciated from the proxy with incorrect setup values
    // The wallet is still deployed but unusable
    // e.g https://etherscan.io/tx/0x087226bfdc7d5ff7e64fec3f4fc87522986213265fa835f22208cae83b9259a8#eventlog
    log.warning("Wallet {} is incorrect (tx: {})", 
                [walletAddr.toHexString(), event.transaction.hash.toHexString()])
  }

}

