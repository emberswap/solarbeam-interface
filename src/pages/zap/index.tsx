import FarmList from '../../features/farm/FarmList'
import Head from 'next/head'
import Menu from '../../features/farm/FarmMenu'
import React, { useContext, useState, useEffect, useMemo } from 'react'
import { formatNumberScale } from '../../functions'
import { usePositions, useFarms, useDistributorInfo, usePPositions } from '../../features/farm/hooks'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { EMBER_ADDRESS, AVERAGE_BLOCK_TIME } from '../../constants'
import { POOLS } from '../../constants/farms'
import EmberswapLogo from '../../components/EmberswapLogo'
import { PriceContext } from '../../contexts/priceContext'
import useMasterChef from '../../features/farm/useMasterChef'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useTVL, useV2PairsWithPrice } from '../../hooks/useV2Pairs'
import { getAddress } from '@ethersproject/address'
import { useVaults } from '../../features/vault/hooks'
import Search from '../../components/Search'
import { updateUserFarmFilter } from '../../state/user/actions'
import { getFarmFilter, useUpdateFarmFilter } from '../../state/user/hooks'
import FarmListItem2 from '../../features/farm/FarmListItem2'
import { useCurrency, useToken } from '../../hooks/Tokens'
import { Currency, NATIVE, Token, currencyEquals, ChainId  } from '../../sdk'
import { WNATIVE } from '../../constants'
import useTokenBalance from '../../hooks/useTokenBalance'
import PoolList from '../../components/PoolList'
import { useActiveWeb3React, useFuse } from '../../hooks'
import CardHeader from '../../components/CardHeader'

export default function Zap(): JSX.Element {
    const { i18n } = useLingui()
    const router = useRouter()
    const { chainId } = useActiveWeb3React()
    const [pendingTx, setPendingTx] = useState(false)
    const addTransaction = useTransactionAdder()
  
    const type = router.query.filter as string
  

  

    const positions = usePositions()
    const ppositions = usePPositions()
    let farms = useFarms()
    const vaults = useVaults()
  
    const distributorInfo = useDistributorInfo()
  
    const tvlInfo = useTVL()
    const priceData = useContext(PriceContext)
  
    const emberPrice = priceData?.['ember']
    const bchPrice = priceData?.['bch']
  
    const firePrice = priceData?.['fire']
  
    const farmingPools = Object.keys(POOLS[chainId]).map((key) => {
      return { ...POOLS[chainId][key], lpToken: key }
    })
  
    let summTvl = tvlInfo.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.tvl
    }, 0)
  
    let summTvlVaults = vaults.reduce((previousValue, currentValue) => {
      return previousValue + (currentValue.totalLp / 1e18) * emberPrice
    }, 0)
  
    const blocksPerDay = 86400 / Number(AVERAGE_BLOCK_TIME[chainId])
  
    const map = (pool) => {
      pool.owner = 'Ember'
      pool.balance = 0
    
        let tvl = 0
        let tvlMap = tvlInfo.map(( tvlInfo, id ) => tvlInfo.tvl)
        tvl = tvlMap[pool.id]
        let totalLp= 0
        const TotalLp = farms.map((farms) => farms.totalLp)
        totalLp = TotalLp[pool.id]
  
  
      function getRewards() {
        const rewardPerBlock =
          ((pool.allocPoint / distributorInfo.totalAllocPoint) * distributorInfo.emberPerSec) / 1e18
  
        const defaultReward = {
          token: 'EMBER',
          icon: '/images/token/ember.png',
          rewardPerBlock,
          rewardPerDay: rewardPerBlock * blocksPerDay,
          rewardPrice: emberPrice,
        }
  
        const defaultRewards = [defaultReward]
  
        return defaultRewards
      }
  
  
      const rewards = getRewards()
  
      var roiPerBlock = 0
  
      if (tvl < 1000){
        roiPerBlock =
        rewards?.reduce((previousValue, currentValue) => {
          return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
        }, 0) / 1000
      }
      else{
        roiPerBlock =
        rewards?.reduce((previousValue, currentValue) => {
          return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
        }, 0) / tvl
      }
  
      const blocksPerHour = 3600 / AVERAGE_BLOCK_TIME[chainId]
      const pair = POOLS[chainId][pool.lpToken]
      const roiPerHour = roiPerBlock * blocksPerHour
      const roiPerDay = roiPerHour * 24
      const roiPerMonth = roiPerDay * 30
      const roiPerYear = roiPerDay * 365
  
      const position = ppositions.find((position) => position.id === pool.id)
  
      return {
        ...pool,
        ...position,
        pair: {
          ...pair,
          decimals: 18,
        },
        totalLp,
        roiPerBlock,
        roiPerHour,
        roiPerDay,
        roiPerMonth,
        roiPerYear,
        rewards,
        tvl,
        blocksPerHour,
      }
    }
  
    const FILTER = {
      all: (farm) => farm.allocPoint > 0,
      my: (farm) => farm?.amount && !farm.amount.isZero() && !farm.allocPoint.isZero(),
      ember: (farm) => farm.pair.token0?.id == EMBER_ADDRESS[chainId] || farm.pair.token1?.id == EMBER_ADDRESS[chainId],
      single: (farm) => !farm.pair.token1,
      bch: (farm) => farm.pair.token0?.id == WNATIVE[chainId] || farm.pair.token1?.id == WNATIVE[chainId],
      stables: (farm) =>
        farm.pair.token0?.symbol == 'FLEXUSD' ||
        farm.pair.token1?.symbol == 'FLEXUSD' || 
        farm.pair.token0?.symbol == 'lawUSD' ||
        farm.pair.token1?.symbol == 'lawUSD' ,
      past: (farm) => farm.allocPoint == 0,
  
    }
  
    const data = farms.map(map).filter((farm) => {
      return type in FILTER ? FILTER[type](farm) : true
    })
  
    const options = {
      keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol', 'pair.token0.name', 'pair.token1.name'],
      threshold: 0.4,
    }
  
    const { result, term, search } = useFuse({
      data,
      options,
    })
  
    const allStaked = positions.reduce((previousValue, currentValue) => {
      return previousValue + (currentValue.pendingEmber / 1e18) * emberPrice
    }, 0) || 0
  
    const valueStaked = positions.reduce((previousValue, currentValue) => {
      const pool = farmingPools.find((r) => parseInt(r.id.toString()) == parseInt(currentValue.id) || 0)
      const poolTvl = tvlInfo.find((r) => getAddress(r.lpToken) == getAddress(pool?.lpToken) || 0)
      return previousValue + (currentValue.amount / 1e18) * poolTvl?.lpPrice
    }, 0) || 0
  
    const { harvest } = useMasterChef()
    farms = farms.sort((a, b) => b.allocPoint - a.allocPoint);
//  return (
//    <>
//      <Head>
//        <title>Zap | EmberSwap</title>
//        <meta key="description" name="description" content="Zap into any farm on EmberSwap" />
//      </Head>
//                <PoolList farms={result} term={term} filter={FILTER} />
//    </>
//  )
return (
    <>
      <Head>
        <title>Zap | EmberSwap</title>
        <meta key="description" name="description" content="Zap - EmberSwap" />
      </Head>
      <div className="container px-0 mx-auto pb-6">
        <div className={`mb-2 pb-4 grid grid-cols-12 gap-4`}>
          <div className="flex justify-center items-center col-span-12 lg:justify">
              <EmberswapLogo />
          </div>
        </div>
        <DoubleGlowShadow maxWidth={false} opacity={'0.4'}>
          <div className={`grid grid-cols-12 gap-2 min-h-1/2`}>
            <div className={`col-span-12`}>
            <div className="container max-w-4xl px-0 mx-auto sm:px-4">
              <Card className="bg-dark-900-custom backdrop-blur-md	z-4"
                        header={
                            <CardHeader className="flex items-center justify-between">
                              <div className="flex flex-col items-center justify-between w-full">
                                <div className="items-center hidden md:flex">
                                  {/* <BackButton defaultRoute="/pool" /> */}
                                  <div className="mb-2 mr-2 text-lg whitespace-nowrap">Select a Pool to Zap Into</div>
                                </div>
                                <Search 
                                    className={'bg-dark-800 rounded border border-dark-800'}
                                    placeholder={'Search by name, symbol or address'}
                                    term={term}
                                    search={(value: string): void => {
                                    search(value)
                                    }}/>
                              </div>
                            </CardHeader>
                          }>
                  <div className={`col-span-12 md:col-span-9 py-4 md:px-6 md:py-4 rounded`}>
                    <PoolList farms={result} term={term} filter={FILTER} />
                  </div>
              </Card>
              </div>
            </div>
          </div>
        </DoubleGlowShadow>
      </div>
    </>
  )
}
