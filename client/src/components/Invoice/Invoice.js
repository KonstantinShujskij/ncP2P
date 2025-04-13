import React, { useState } from 'react'
import { formatCardNumber, formatTime, formatAmount } from '../../utils'

import Copy from '../UI/copy'

import styles from './Invoice.module.css'
import useInvoiceApi from '../../API/invoice.api'


function Invoice({invoice, refresh}) {
    const invoiceApi = useInvoiceApi()

    const [isRejectWait, setIsRejectWait] = useState(false)
    const [isValidWait, setIsValidWait] = useState(false)
    const [isValidOkWait, setIsValidOkWait] = useState(false)

    let clientColor = '#4bef81'
    if(invoice?.conv < 0.5 || invoice?.confirm < 10) { clientColor = '#ff6b6b' }
    else if(!!invoice?.ncpayConv?.all?.conversion && (invoice?.ncpayConv?.all?.conversion < 0.5 || invoice?.ncpayConv?.all?.confirmCount < 10)) { clientColor = '#f6a740' }
    else if(!!invoice?.ncpayConv?.later30?.conversion && (invoice?.ncpayConv?.later30?.conversion < 0.5 || invoice?.ncpayConv?.later30?.confirmCount < 10)) { clientColor = '#f6a740' }

    const rejectHandler = async () => {
        if(!isRejectWait) { 
            setIsValidWait(false)
            setIsValidOkWait(false)

            return setIsRejectWait(true) 
        }

        await invoiceApi.reject(invoice.id)
        setIsRejectWait(false) 
        refresh()
    }

    const validHandler = async () => {
        if(!isValidWait) { 
            setIsValidOkWait(false)
            setIsRejectWait(false) 

            return setIsValidWait(true) 
        }

        await invoiceApi.valid(invoice.id)
        setIsValidWait(false)
        refresh()
    }

    const validOkHandler = async () => {
        if(!isValidOkWait) { 
            setIsValidWait(false)
            setIsRejectWait(false) 

            return setIsValidOkWait(true) 
        }

        await invoiceApi.validOk(invoice.id)
        setIsValidOkWait(false)
        refresh()
    }

    return (
        <div className={styles.main}>
            <div className={styles.excel}>
                <div className={styles.amount}>
                    <Copy value={invoice?.initialAmount} label={formatAmount(invoice?.initialAmount)} />
                    <Copy value={invoice?.amount} label={formatAmount(invoice?.amount)} />
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.card}>
                    <Copy value={invoice?.payment} label={invoice?.payment} />
                    <Copy value={invoice?.card} label={formatCardNumber(invoice?.card)} />
                    <a href={invoice?.payLink} target='_blanck'>Link to Proof</a>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    <Copy value={invoice?.id} label={invoice?.id? invoice.id : 'SystemId'} />
                    <Copy value={invoice?.refId} label={invoice?.refId? invoice.refId : 'ReferenceId'} />
                    <Copy value={invoice?.partnerId} label={invoice?.partnerId? invoice.partnerId : 'PartnerId'} />
                </div>
            </div>
            <div className={styles.excel}>
                {(invoice.validOk && invoice?.status !== 'CONFIRM' && invoice?.status !== 'REJECT')? 
                    <>
                        <div className={styles.status} data-status="VALID-OK">VALID-OK</div>
                    </> : 
                    <>
                        <div className={styles.status} data-status={invoice?.status}>{invoice?.status}</div>
                    </>
                }
            </div>
            <div className={styles.excel}>  
                <div className={styles.action}>
                    <div className={styles.buttons}>
                        {(invoice.status === "WAIT" || invoice.status === "VALID") && <>
                            <button 
                                className={`${styles.button} ${isValidOkWait? styles.open : null}`} 
                                onClick={() => validOkHandler()}
                                data-type="accept"
                            >
                                {invoice.validOk? "To Valid" : "To Valid Ok"}
                            </button>
                        </>}

                        {(invoice.status === "REJECT") && <>
                            <button 
                                className={`${styles.button} ${isValidWait? styles.open : null}`} 
                                onClick={() => validHandler()}
                                data-type="accept"
                            >
                                Valid
                            </button>
                        </>}

                        {(invoice.status === "VALID") && <>
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
                <div className={styles.client}>
                    <Copy value={invoice?.client? invoice?.client : ""} label={invoice?.client? invoice?.client : "Unknow Client"} />
                    {!!invoice?.client && <div className={styles.line} style={{backgroundColor: clientColor}}></div>}
                    {!!invoice?.client && invoice?.conv !== -1 && 
                        <div className={styles.conv}>{ (invoice?.conv).toFixed(2) } / <span className={styles.green}>{ invoice?.confirm }</span></div>
                    }
                    {!!invoice?.client && !!invoice?.ncpayConv?.all && 
                        <div className={styles.conv}>{ (invoice?.ncpayConv?.all?.conversion).toFixed(2) } / <span className={styles.green}>{ invoice?.ncpayConv?.all?.confirmCount }</span></div>
                    }
                    {!!invoice?.client && !!invoice?.ncpayConv?.later30 && 
                        <div className={styles.conv}>{ (invoice?.ncpayConv?.later30?.conversion).toFixed(2) } / <span className={styles.green}>{ invoice?.ncpayConv?.later30?.confirmCount }</span></div>
                    }
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.time}>{formatTime(invoice?.createdAt)}</div>
            </div>
        </div>
    )
}


export default Invoice