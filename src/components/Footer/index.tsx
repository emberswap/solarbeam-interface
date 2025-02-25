import { ANALYTICS_URL } from '../../constants'
import { ChainId } from '../../sdk'
import ExternalLink from '../ExternalLink'
import Polling from '../Polling'
import { t } from '@lingui/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import React from 'react'
import NavLink from '../NavLink'

const Footer = () => {
  const { chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  return (
    <footer className="flex-shrink-0 static w-full mt-8 sm:mt-0">
      <div className="flex items-center justify-between h-20 px-4 ">
      <Polling />
      </div>
    </footer>
  )
}

export default Footer
