import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import useProofApi from '../../API/proof.api'
import usePage from '../../hooks/page.hook'

import * as filterSelectors from '../../redux/selectors/filter.selectors'

import Proof from '../../components/Proof/Proof'
import ProofFilter from '../../components/ProofFilter/ProofFilter'

import styles from './Valid.module.css'

import { useDispatch } from 'react-redux'
import * as filterActions from '../../redux/actions/filter.actions'


function Valid() {
  const dispatch = useDispatch()

  const proofApi = useProofApi()

  const pagination = usePage(30)
  const page = pagination.page

  const triger = useSelector(filterSelectors.proofTriger)
  const auto = useSelector(filterSelectors.proofAuto)

  const [proofs, setProofs] = useState([])

  const load = async (page) => {
    const {list, count} = await proofApi.list(page, pagination.limit)

    pagination.setCount(count)
    setProofs(list)
  }

  const autoHandler = () => dispatch(filterActions.autoProof())

  useEffect(() => {
    load(page)

    if(auto) { 
      const timer = setInterval(() => load(page), 10000) 

      return () => { clearInterval(timer) }
    }

  }, [page, triger, auto])


  return (
    <div className={styles.main}>
        <div className={styles.top}>
          <div>
            <div className={`${styles.auto} ${auto? styles.open : null}`} onClick={autoHandler}>Auto</div>
          </div>
          <ProofFilter />
        </div>

        <div className={styles.table}>
            {proofs.map((proof) => <Proof proof={proof} refresh={() => load(page)} key={proof.id} />)}
        </div>

        <div className={styles.bottom}>
            <button onClick={pagination.back}>
                Previos
            </button>
            <button onClick={pagination.next}>
                Next
            </button>
        </div>
    </div>
  )
}

export default Valid