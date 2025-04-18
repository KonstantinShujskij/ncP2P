import React, { useEffect, useState } from 'react'
import usePaymentApi from '../../API/payment.api'
import { formatAmount } from '../../utils'

import styles from './Payment.module.css'
import Copy from '../UI/copy'


function formatCardNumber(number) {
    if(!number) { return "0000 0000 0000 0000" }
    return number.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim();
}

function formatTime(milliseconds) {
    if(!milliseconds) return null

    return (new Date(parseInt(milliseconds))).toLocaleString("uk-UA", {timeZone: "Europe/Kiev"}).replace(',', '')
}


function Payment({payment, refresh}) {
    const paymentApi = usePaymentApi()
    
    const [isWaitFreeze, setIsWaitFreeze] = useState(false)
    const [isRejectWait, setIsRejectWait] = useState(false)
    const [isTailWait, setIsTailWait] = useState(false)

    const freezeHandler = async () => {
        if(!isWaitFreeze) { 
            setIsTailWait(false)
            setIsRejectWait(false)

            return setIsWaitFreeze(true) 
        }

        if(payment.isFreeze) { await paymentApi.unfreeze(payment.id) }
        else { await paymentApi.freeze(payment.id) }

        setIsWaitFreeze(false)
        refresh()
    }
        
    const rejectHandler = async () => {
        if(!isRejectWait) { 
            setIsTailWait(false)
            setIsWaitFreeze(false)

            return setIsRejectWait(true) 
        }

        await paymentApi.reject(payment.id)
        setIsRejectWait(false) 
        refresh()
    }

    const tailHandler = async () => {
        if(!isTailWait) { 
            setIsRejectWait(false) 
            setIsWaitFreeze(false)

            return setIsTailWait(true)
        }

        await paymentApi.push(payment.id)
        setIsTailWait(false) 
        refresh()
    }

    const priorityHandler = async () => {
        await paymentApi.togglePriority(payment.id)
        refresh()
    }

    const proofsHandler = async () => {
        await paymentApi.getProofs(payment.id)
        refresh()
    }

    const [subStatus, setSubStatus] = useState('')

    useEffect(() => {        
        if(payment?.isAllValidOk) { setSubStatus('VALID-OK') }
        if(payment?.isOneValid) { setSubStatus('VALID') }
        if(payment?.isOneWait) { setSubStatus('WAIT') }
    
        if(payment?.isTail) { 
            if(!subStatus) { setSubStatus('TAIL') }
            else {  setSubStatus('TAIL-VALID') }
        }
    }, [])

    return (
        <div className={styles.main}>
            <div className={styles.excel}>
                <div className={styles.amount}>
                    <Copy value={payment?.initialAmount} label={formatAmount(payment?.initialAmount)} />
                    <Copy value={payment?.amount} label={formatAmount(payment?.amount)} />
                    <Copy value={payment?.currentAmount} label={formatAmount(payment?.currentAmount)} />
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.card}>
                    <Copy value={payment?.card} label={formatCardNumber(payment?.card)} />
                    <span className={styles.proofs} onClick={() => proofsHandler()}>Get Proofs to Telegram</span>
                    {!!payment?.tailId && <div className={styles.row}>
                        <Copy value={payment?.tailAmount} label={`tail = ${formatAmount(payment?.tailAmount)}`}  />
                        <span  style={{color: payment?.isTail? '#f6a740' : '#4bef81'}} >{payment?.isTail? 'wait' : 'confirm'}</span> 
                    </div>}
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    <Copy value={payment?.id} label={payment?.id? payment.id : 'SystemId'} />
                    <Copy value={payment?.refId} label={payment?.refId? payment.refId : 'ReferenceId'} />
                    <Copy value={payment?.partnerId} label={payment?.partnerId? payment.partnerId : 'PartnerId'} />
                </div>
            </div>
            <div className={styles.col}>
                <div className={styles.status} data-status={payment?.status}>{payment?.status}</div>
                <div className={styles.substatus} data-status={subStatus}>{subStatus}</div>
            </div>
            <div className={styles.excel}>
                <div className={styles.action}>
                    <div className={styles.buttons}>
                        {payment.status !== "SUCCESS" && payment.status !== "REJECT" && <>
                            <button 
                                className={`${styles.button} ${isWaitFreeze? styles.open : null}`} 

                                onClick={() => freezeHandler()}
                                data-type="decline"
                            >
                                {payment?.isFreeze? "Unfreeze" : "Freeze" }
                            </button>
                        </>}

                        <button 
                            className={`${styles.priority} ${payment?.priority? styles.open : null}`} 
                            onClick={() => priorityHandler()}
                        >
                            <i className="fa-solid fa-star"></i>
                        </button>

                        {payment?.isFreeze && <>
                            <button 
                                className={`${styles.button} ${isTailWait? styles.open : null}`} 
                                onClick={() => tailHandler()}
                                data-type="accept"
                            >
                                PTail
                            </button>
                        </>}

                        {payment.status === "ACTIVE" && <>
                            <button 
                                className={`${styles.button} ${isRejectWait? styles.open : null}`} 
                                onClick={() => rejectHandler()}
                                data-type="decline"
                            >
                                Reject
                            </button>
                        </>}
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.time}>{formatTime(payment?.createdAt)}</div>
            </div>
        </div>
    )
}

export default Payment