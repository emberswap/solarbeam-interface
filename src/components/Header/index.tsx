import { ChainId, Currency, NATIVE} from '../../sdk'
import React from 'react'

import Image from 'next/image'
import Link from 'next/link'
import More from './More'
import NavLink from '../NavLink'
import { Popover } from '@headlessui/react'
import Web3Status from '../Web3Status'
import Web3Network from '../Web3Network'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useETHBalances } from '../../state/wallet/hooks'
import { useLingui } from '@lingui/react'
import ThemeSwitch from '../ThemeSwitch'
import TokenStats from '../TokenStats'
import LanguageSwitch from '../LanguageSwitch'
import { isMobile } from 'react-device-detect'
import { useRouter } from 'next/router'

function AppBar(): JSX.Element {
  const { i18n } = useLingui()
  const { account, chainId, library } = useActiveWeb3React()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const router = useRouter()
  const isFarm = router.asPath.startsWith('/exchange/swap?')

  return (
    <header className="flex-shrink-0 w-full">
      <Popover as="nav" className="z-10 w-full bg-transparent">
        {({ open }) => (
          <>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="hidden sm:block sm:ml-4">
                    <div className="flex space-x-2">
                     {!isFarm ?
                      <NavLink href="/exchange/swap">
                        <a
                          id={`swap-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Swap`)}
                        </a>
                      </NavLink>
                      :
                      <NavLink href={`${router.asPath}`}>
                        <a
                          id={`swap-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Swap`)}
                        </a>
                      </NavLink>
                     }
                      <NavLink href="/exchange/pool">
                        <a
                          id={`pool-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Pool`)}
                        </a>
                      </NavLink>
                     {/* <NavLink href="/zap">
                        <a
                          id={`zap-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Zap`)}
                        </a>
                      </NavLink>*/}
                      <NavLink href={'/farm?filter=all'}>
                        <a
                          id={`farm-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Farm`)}
                        </a>
                      </NavLink>
                      <NavLink href={'/vaults?filter=all'}>
                        <a
                          id={`vaults-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Vaults`)}
                        </a>
                      </NavLink>
                      <NavLink href={'/locker'}>
                        <a
                          id={`farm-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Locker`)}
                        </a>
                      </NavLink>
                      <NavLink href={'/vote?filter=active'}>
                          <a
                            id={`governance-nav-link`}
                            className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                          >
                            {i18n._(t`Governance`)}
                          </a>
                        </NavLink>
                      <NavLink href="https://analytics.emberswap.com">
                        <a
                         // target="_blank"
                          id={`swap-nav-link`}
                          className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Analytics`)}
                        </a>
                      </NavLink>
                    </div>
                  </div>
                </div>

                <div className="fixed bottom-0 left-0 z-10 flex flex-row items-center justify-center w-full p-4 lg:w-auto bg-dark-1000 lg:relative lg:p-0 lg:bg-transparent">
                  <div className="flex items-center justify-between w-full space-x-2 sm:justify-end">
                    {chainId && !isMobile && (
                      <div className="w-auto flex items-center rounded mr-1 bg-dark-800 shadow-sm text-primary text-xs hover:bg-dark-700 whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto hidden sm:block">
                        <TokenStats token="BCH" />
                      </div>
                    )}
                    {chainId && !isMobile && (
                      <div className="w-auto flex items-center rounded mr-1 bg-dark-800 shadow-sm text-primary text-xs hover:bg-dark-700 whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto">
                        <TokenStats token="EMBER" />
                      </div>
                    )}
                    <div className="w-auto flex items-center rounded bg-red-900 hover:bg-red-900-custom p-0.5 whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto">
                      {account && chainId && userEthBalance && (
                        <>
                          <div className="px-3 py-2 text-primary text-bold">
                            {userEthBalance?.toSignificant(3)} {NATIVE[chainId].symbol}
                          </div>
                        </>
                      )}
                      <Web3Status />
                    </div>
                    <div className="hidden md:block">
                      <LanguageSwitch />
                    </div>
                    <ThemeSwitch/>                  
                    {library && library.provider.isMetaMask && !isMobile && (
                      <div className="hidden sm:inline-block">
                        <Web3Network />
                      </div>
                    )}
                    <More />
                  </div>
                </div>
                <div className="flex flex-1 -mr-2 sm:hidden">
                  <div className="flex-1">
                    <Image src="/icon.png" alt="EmberSwap" height="40px" width="40px" className="sm:hidden" />
                  </div>
                  <LanguageSwitch />
                  <Popover.Button className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-high-emphesis focus:outline-none">
                    <span className="sr-only">{i18n._(t`Open main menu`)}</span>
                    {open ? (
                      <svg
                        className="block w-6 h-6"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg
                        className="block w-6 h-6"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    )}
                  </Popover.Button>
                </div>
              </div>
            </div>

            <Popover.Panel className="sm:hidden header-border-b">
              <div className="flex flex-col px-4 pt-2 pb-3 space-y-1">
              {!isFarm ?
                <Link href={'/exchange/swap'}>
                  <a
                    id={`swap-nav-link`}
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Swap`)}
                  </a>
                </Link>
                :
                <Link href={`${router.asPath}`}>
                  <a
                    id={`swap-nav-link`}
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Swap`)}
                  </a>
                </Link>
              }
                <Link href={'/exchange/pool'}>
                  <a
                    id={`pool-nav-link`}
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Pool`)}
                  </a>
                </Link>
                <Link href={'/farm?filter=all'}>
                  <a
                    id={`farm-nav-link`}
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Farm`)}
                  </a>
                </Link>
                <Link href={'/vaults?filter=all'}>
                  <a
                    id={`vaults-nav-link`}
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Vaults`)}
                  </a>
                </Link>
                <Link href={'/locker'}>
                  <a
                    id={`farm-nav-link`}
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Locker`)}
                  </a>
                </Link>
                <Link href={'/vote?filter=active'}>
                          <a
                            id={`governance-nav-link`}
                            className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                          >
                            {i18n._(t`Governance`)}
                          </a>
                        </Link>
                <Link href="https://analytics.emberswap.com">
                  <a
                   // target="_blank"
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap"
                  >
                    {i18n._(t`Analytics`)}
                  </a>
                </Link>
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>
    </header>
  )
}

export default AppBar
