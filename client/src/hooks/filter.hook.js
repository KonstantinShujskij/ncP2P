import { useDispatch } from 'react-redux'

import * as filterActions from '../redux/actions/filter.actions'


export default function useFilter() {
    const dispatch = useDispatch()

    const setPaymentsFilter = (filter) => { dispatch(filterActions.setPayments(filter)) } 
    const setInvoicesFilter = (filter) => { dispatch(filterActions.setInvouces(filter)) } 

    const clearPaymentsFilter = () => { dispatch(filterActions.clearPayments()) }    
    const clearInvoicesFilter = () => { dispatch(filterActions.clearInvoices()) }

    const clear = () => {
        dispatch(filterActions.clearPayments())
        dispatch(filterActions.clearInvoices())
    }

    return {
        setPaymentsFilter,
        setInvoicesFilter,
        clearPaymentsFilter,
        clearInvoicesFilter,

        clear
    }
}