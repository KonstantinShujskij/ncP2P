import React, { useState } from 'react'

import styles from './PaymentFilter.module.css'
import Input from '../UI/Input'
import useInput from '../../hooks/input.hook'


function PaymentFilter() {
    const initialAmountMin = useInput()
    const initialAmountMax = useInput()
    const amountMax = useInput()
    const amountMin = useInput()
    const currentAmountMax = useInput()
    const currentAmountMin = useInput()
    const cardNumber = useInput()
    const systemId = useInput()
    const referenceId = useInput()
    const partnerId = useInput()
    const [statusList, setStatusList] = useState([])

    const addStatusHandler = (status='ALL') => {
        if(status === 'ALL') { return setStatusList([]) }

        setStatusList((prew) => {
            const newValue = prew.filter((item) => (item !== status))
            if(newValue.length === prew.length) { newValue.push(status) }
            return newValue
        })
    }

    const StatisItem = ({status}) => (
        <div 
            className={`${styles.statusItem} ${statusList.includes(status)? styles.active : null}`} 
            onClick={() => addStatusHandler(status)}
            data-status={status} 
        >
            {status}
        </div>
    ) 

    
    return (
        <div className={styles.main}>
            <div className={styles.excel}>
                <div className={styles.amount}>
                    <div className={styles.item}>
                        <Input input={initialAmountMin} className={styles.input} placeholder='Initial Min' />
                        <Input input={initialAmountMax} className={styles.input} placeholder='Initial Max' />
                    </div>
                    <div className={styles.item}>
                        <Input input={amountMin} className={styles.input} placeholder='Amount Min' />
                        <Input input={amountMax} className={styles.input} placeholder='Amount Max' />
                    </div>
                    <div className={styles.item}>
                        <Input input={currentAmountMin} className={styles.input} placeholder='Current Min' />
                        <Input input={currentAmountMax} className={styles.input} placeholder='Current Max' />
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.card}>
                    <div className={styles.item}>
                        <Input input={cardNumber} className={styles.input} placeholder='Card Number' />
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    <div className={styles.item}>
                        <Input input={systemId} className={styles.input} placeholder='System Id' />
                    </div>
                    <div className={styles.item}>
                        <Input input={referenceId} className={styles.input} placeholder='Reference Id' />
                    </div>
                    <div className={styles.item}>
                        <Input input={partnerId} className={styles.input} placeholder='Partner Id' />
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.status}>
                    <div 
                        className={`${styles.statusItem} ${!statusList.length? styles.active : null}`} 
                        onClick={() => addStatusHandler('ALL')}
                        data-status="ALL" 
                    >
                        ALL
                    </div>
                    <div className={styles.item}>
                        <StatisItem status={'ACTIVE'} />
                        <StatisItem status={'BLOCKED'} />
                    </div>
                    <div className={styles.item}>
                        <StatisItem status={'SUCCESS'} />
                        <StatisItem status={'REJECT'} />
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.time}>Create At</div>
            </div>
        </div>
  )
}

export default PaymentFilter