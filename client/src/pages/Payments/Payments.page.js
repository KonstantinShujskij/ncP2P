import React, { useEffect, useState } from 'react'
import usePaymentApi from '../../API/payment.api'
import usePage from '../../hooks/page.hook'
import { useSelector } from 'react-redux'

import * as filterSelectors from '../../redux/selectors/filter.selectors'

import styles from './Payments.module.css'
import Payment from '../../components/Payment/Payment'
import PaymentFilter from '../../components/PaymentFilter/PaymentFilter'


function Payments() {
  const paymentApi = usePaymentApi()

  const pagination = usePage(30)
  const page = pagination.page

  // const triger = useSelector(filterSelectors.paymentTriger)
  // const isPaymentActive = useSelector(userSelectors.paymentActive)
  // const isIbanActive = useSelector(userSelectors.ibanActive)

  const [payments, setPayments] = useState([])

  const load = async (page) => {
    const {list, count} = await paymentApi.list(page, pagination.limit)

    pagination.setCount(count)
    setPayments(list)
  }

  useEffect(() => {
    const timer = setInterval(() => load(page), 10000)
    load(page)

    return () => { clearInterval(timer) }
  }, [page]) // , triger


  return (
    <div className={styles.main}>
          <div className={styles.top}>
            <PaymentFilter />
          </div>

          {/* <div className={styles.info}>
              <div>Amount</div>
              <div>Card/Iban</div>
              <div>ID</div>
              <div className={styles.status}>Status</div>
              <div className={styles.status}>Action</div>
              <div className={styles.date}>Created</div>
          </div> */}

          <div className={styles.table}>
              {payments.map((payment) => <Payment payment={payment} refresh={() => load(page)} key={payment.id} />)}
          </div>

          {/* <div className={styles.bottom}>
              <button onClick={pagination.back}>
                  Previos
              </button>
              <button onClick={pagination.next}>
                  Next
              </button>
          </div> */}
    </div>
  )
}

export default Payments