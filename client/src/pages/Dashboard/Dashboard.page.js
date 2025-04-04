import React, { useState } from 'react'

import styles from './Dashboard.module.css'
import usePaymentApi from '../../API/payment.api'
import useInvoiceApi from '../../API/invoice.api'
import useUserApi from '../../API/user.api'
import Copy from '../../components/UI/copy'
import Input from '../../components/UI/Input'
import useInput from '../../hooks/input.hook'
import { getTimestamp } from '../../utils'


function Dashboard() {
  const paymentApi = usePaymentApi()
  const invoiceApi = useInvoiceApi()
  const userApi = useUserApi()

  const [data, setData] = useState(null)

  const min = useInput(null)
  const max = useInput(null)

  const load = async () => {
    const start = getTimestamp(min.value)
    const stop = getTimestamp(max.value)

    const paymentData = await paymentApi.getStatistics(start, stop)
    const invoiceData = await invoiceApi.getStatistics(start, stop)
    const autoData = await userApi.getAutoStatistics(start, stop)

    if(paymentData?.conversion) { paymentData.conversion = paymentData.conversion.toFixed(2) }
    if(paymentData?.avarageSum) { paymentData.avarageSum = paymentData.avarageSum.toFixed(2) }
    if(invoiceData?.conversion) { invoiceData.conversion = invoiceData.conversion.toFixed(2) }
    if(invoiceData?.avarageSum) { invoiceData.avarageSum = invoiceData.avarageSum.toFixed(2) }

    setData({
      payment: paymentData,
      invoice: invoiceData,
      autoData: autoData
    })
  }


  return (
    <div className={styles.main}>
      <h1>Dashboard</h1>

      <div className={styles.flex}>
          <Input input={min} placeholder='Start Date'/>
          <Input input={max} placeholder='Stop Date'/>

          <button className='button' onClick={() => load()}>Load</button>
      </div>

      <h1>Payment</h1>
      <div>
        <p className={styles.item}>count: <Copy value={data?.payment?.count || 0} label={data?.payment?.count || 0} /></p>
        <p className={styles.item}>confirmCount: <Copy value={data?.payment?.confirmCount || 0} label={data?.payment?.confirmCount || 0} /> </p>
        <p className={styles.item}>conversion: <Copy value={data?.payment?.conversion || 0} label={data?.payment?.conversion || 0} /></p>
        <p className={styles.item}>totalConfirm: <Copy value={data?.payment?.totalConfirm || 0} label={data?.payment?.totalConfirm || 0} /></p>
        <p className={styles.item}>totalInitialConfirm: <Copy value={data?.payment?.totalInitialConfirm || 0} label={data?.payment?.totalInitialConfirm || 0} /></p>
        <p className={styles.item}>avarageSum: <Copy value={data?.payment?.avarageSum || 0} label={data?.payment?.avarageSum || 0} /></p>
      </div>

      <h1>Invoice</h1>
      <div>
        <p className={styles.item}>count: <Copy value={data?.invoice?.count || 0} label={data?.invoice?.count || 0} /></p>
        <p className={styles.item}>confirmCount: <Copy value={data?.invoice?.confirmCount || 0} label={data?.invoice?.confirmCount || 0} /> </p>
        <p className={styles.item}>conversion: <Copy value={data?.invoice?.conversion || 0} label={data?.invoice?.conversion || 0} /></p>
        <p className={styles.item}>totalConfirm: <Copy value={data?.invoice?.totalConfirm || 0} label={data?.invoice?.totalConfirm || 0} /></p>
        <p className={styles.item}>totalInitialConfirm: <Copy value={data?.invoice?.totalInitialConfirm || 0} label={data?.invoice?.totalInitialConfirm || 0} /></p>
        <p className={styles.item}>avarageSum: <Copy value={data?.invoice?.avarageSum || 0} label={data?.invoice?.avarageSum || 0} /></p>
      </div>

      <h1>Auto</h1>
      <div>
        <p className={styles.item}>Mono conversion: <Copy value={data?.autoData?.mono?.conversion || 0} label={data?.autoData?.mono?.conversion?.toFixed(2) || 0} /></p>
        <p className={styles.item}>Privat conversion: <Copy value={data?.autoData?.privat?.conversion || 0} label={data?.autoData?.mono?.conversion?.toFixed(2) || 0} /></p>
      </div>
    </div>
  )
}


export default Dashboard 