import React, { useCallback, useEffect, useState } from 'react'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { fortmatic, injected, portis } from '../../connectors'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'

import { AbstractConnector } from '@web3-react/abstract-connector'
import AccountDetails from '../../components/AccountDetails'
import { ApplicationModal } from '../../state/application/actions'
import { ButtonConfirmed, ButtonError } from '../../components/Button'
import ExternalLink from '../../components/ExternalLink'
import Image from 'next/image'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import { OVERLAY_READY } from '../../connectors/Fortmatic'
import Option from './Option'
import PendingView from './PendingView'
import ReactGA from 'react-ga'
import { SUPPORTED_WALLETS } from '../../constants'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { XIcon } from '@heroicons/react/outline'
import { isMobile } from 'react-device-detect'
import styled from 'styled-components'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import usePrevious from '../../hooks/usePrevious'
import { SUPPORTED_NETWORKS } from '../NetworkModal'
import { ChainId } from '../../sdk'
import cookie from 'cookie-cutter'
import { useActiveWeb3React } from '../../hooks'
import { Activity } from 'react-feather'

const CloseIcon = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const HeaderRow = styled.div`
  margin-bottom: 1rem;
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr;
`

const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`
const NetworkIcon = styled(Activity)`
  width: 16px;
  height: 16px;
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error, deactivate } = useWeb3React()

  const { i18n } = useLingui()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)

  const toggleWalletModal = useWalletModalToggle()

  const previousAccount = usePrevious(account)

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  const tryActivation = async (connector: (() => Promise<AbstractConnector>) | AbstractConnector | undefined) => {
    let name = ''
    let conn = typeof connector === 'function' ? await connector() : connector

    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name)
      }
      return true
    })
    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name,
    })
    setPendingWallet(conn) // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (conn instanceof WalletConnectConnector && conn.walletConnectProvider?.wc?.uri) {
      conn.walletConnectProvider = undefined
    }

    conn &&
      activate(conn, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(conn) // a little janky...can't use setError because the connector isn't set
        } else {
          setPendingError(true)
        }
      })
  }

  // close wallet modal if fortmatic modal is active
  useEffect(() => {
    fortmatic.on(OVERLAY_READY, () => {
      toggleWalletModal()
    })
  }, [toggleWalletModal])

  const SwitchNetworkTo = async () => {
    // `library` context here is invalid, we use the direct communiaction with Metamask via window.ethereum
    const params = SUPPORTED_NETWORKS[ChainId.SMARTBCH]
    cookie.set('chainId', ChainId.SMARTBCH)

    const ethereum = window.ethereum as any;
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [ { chainId: params.chainId } ],
      });
    } catch (switchError: any) {
      console.log(switchError);
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ params ],
          });
        } catch (addError) {
          console.log(addError);
          // handle adding network error
          throw addError;
        }
      } else {
        // handle other "switch" errors
        throw switchError;
      }
    }
  }
  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key]

      // check for mobile options
      if (isMobile) {
        // disable portis on mobile for now
        if (option.connector === portis) {
          return null
        }

          return (
            <Option
              onClick={() => {
                option.connector !== connector && !option.href && tryActivation(option.connector)
              }}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={'/images/wallets/' + option.iconName}
            />
          )
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#E8831D'}
                header={'Install Metamask'}
                subheader={null}
                link={'https://metamask.io/'}
                icon="/images/wallets/metamask.png"
              />
            )
          } else if (option.name === 'Trust Wallet') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#3688EB'}
                header={'Install Trust Wallet'}
                subheader={null}
                link={'https://trustwallet.com/'}
                icon="/images/wallets/trustwallet.svg"
              />
            )
          } else {
            return null // dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector)
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} // use option.descriptio to bring back multi-line
            icon={'/images/wallets/' + option.iconName}
          />
        )
      )
    })
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <XIcon width="24px" height="24px" />
          </CloseIcon>
          <HeaderRow style={{ paddingLeft: 0, paddingRight: 0 }}>
            {error instanceof UnsupportedChainIdError ? i18n._(t`Wrong Network`) : i18n._(t`Error connecting`)}
          </HeaderRow>
          <div>
            {error instanceof UnsupportedChainIdError ? (
              <h5>{i18n._(t`Please connect to the appropriate network.`)}</h5>
            ) : (
              i18n._(t`Error connecting. Try refreshing the page.`)
            )}
            <div/>
            <ButtonConfirmed 
              className="flex items-center w-full text-sm justify-center px-4 py-2 text-black bg-opacity-80 hover:bg-opacity-100"
              size="sm"
              variant="outlined"
              color="gradient"            
              onClick={SwitchNetworkTo}>
  <div className="mr-1">
    <NetworkIcon />
  </div>             {i18n._(t`Switch to SmartBCH`)}
            </ButtonConfirmed>
            <div style={{ marginTop: '1rem' }} />
            <ButtonError error={true} size="sm" onClick={deactivate}>
              {i18n._(t`Disconnect`)}
            </ButtonError>
          </div>
        </UpperSection>
      )
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
        />
      )
    }
    return (
      <div className="flex flex-col space-y-4">
        <ModalHeader title={i18n._(t`Select a Wallet`)} onClose={toggleWalletModal} />
        {walletView === WALLET_VIEWS.ACCOUNT && (
          <HeaderRow>
            <HoverText>{i18n._(t`Connect to a wallet`)}</HoverText>
          </HeaderRow>
        )}
        <div className="flex flex-col space-y-6">
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              connector={pendingWallet}
              error={pendingError}
              setPendingError={setPendingError}
              tryActivation={tryActivation}
            />
          ) : (
            <div className="flex flex-col space-y-5 overflow-y-auto">{getOptions()}</div>
          )}
          {walletView !== WALLET_VIEWS.PENDING && (
            <div className="flex flex-col text-center">
              <div className="text-secondary">{i18n._(t`New to Crypto?`)}</div>
              <ExternalLink href="https://ethereum.org/wallets/" color="light-green">
                {i18n._(t`Learn more about wallets`)}
              </ExternalLink>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={90}>
      {getModalContent()}
    </Modal>
  )
}
