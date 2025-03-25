import React from 'react'

import useInput from '../../hooks/input.hook'

import Input from '../../components/UI/Input'

import styles from './CreatePayment.module.css'
import usePaymentApi from '../../API/payment.api'
import useAlert from '../../hooks/alert.hook'


function CreatePayment() {
  const amount = useInput('') 
  const card = useInput('') 
  const refId = useInput('') 
  const course = useInput('') 

  const Payment = usePaymentApi()
  const Alert = useAlert()

  const createHandler = async () => { 
    const data = await Payment.create(card.value, amount.value, refId.value, '', course.value)

    if(data) {
      amount.clear()
      card.clear()
      refId.clear()
      course.clear()

      Alert.pushMess('Success')
    } 
  }
  
  return (
    <div className={styles.main}>
        <div className={styles.form}>
          <h3 className={styles.title}>Make Payment</h3>
          <Input input={card} type='text' placeholder='card' />
          <Input input={amount} type='text' placeholder='Amount' />
          <Input input={course} type='text' placeholder='Course' />
          <Input input={refId} type='text' placeholder='Ref Id' />
          <button onClick={createHandler}>Create</button>
        </div>
    </div>
  )
}


export default CreatePayment