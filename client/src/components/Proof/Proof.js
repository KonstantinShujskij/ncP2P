import React, { useState } from 'react'
import { formatTime } from '../../utils'

import Copy from '../UI/copy'

import styles from './Proof.module.css'
import { BASE_URL } from '../../const'
import Input from '../UI/Input'
import useInput from '../../hooks/input.hook'
import useProofApi from '../../API/proof.api'


function Proof({proof, refresh}) {
    const proofApi = useProofApi()

    const number = useInput(proof?.kvitNumber)

    const [isDecline, setIsDecline] = useState(false)
    const [isApprove, setIsApprove] = useState(false)

    const declineHandler = async () => {
        if(!isDecline) { return setIsDecline(true) }

        setIsDecline(false)

        const isDecline = !!(await proofApi.decline(proof.id))
        if(isDecline) { refresh() }
    } 
    const acceptHandler = async () => {
        if(!isApprove) { return setIsApprove(true) }

        setIsApprove(false)

        const isDecline = !!(await proofApi.approve(proof.id))
        if(isDecline) { refresh() }
    } 

    return (
        <div className={styles.main}>
            <div className={styles.excel}>
                <div className={styles.amount}>
                    <Copy value={proof?.amount} label={proof?.amount || 0} />
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.card}>
                    <Copy value={proof?.invoice} label={proof?.invoice} />
                    <Copy value={proof?.kvitNumber} label={proof?.kvitNumber} />
                    <a className={styles.link} href={`${BASE_URL}/kvits/${proof.kvitFile}`} target='_blanck' >{proof.kvitFile? 'Check File' : 'Have not File'}</a>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    <Copy value={proof?.id} label={proof?.id? proof.id : 'SystemId'} />
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.status} data-status={proof?.status}>{proof?.status}</div>
            </div>
            <div className={styles.excel}>
                <div className={styles.action}>
                    <div className={styles.item}>
                        <Input input={number} className={styles.input} placeholder="Kvit Number" />
                    </div>
                    <div className={styles.buttons}>
                        <button 
                            className={`${styles.button} ${isDecline? styles.open : null}`} 
                            onClick={() => declineHandler()}
                            data-type="decline"
                        >
                            Decline
                        </button>
                        <button 
                            className={`${styles.button} ${isApprove? styles.open : null}`} 
                            onClick={() => acceptHandler()}
                            data-type="accept"
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.time}>{formatTime(proof?.createdAt)}</div>
            </div>
        </div>
    )
}


export default Proof