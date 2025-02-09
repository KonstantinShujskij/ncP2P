import { useDispatch } from 'react-redux'

import * as filterActions from '../redux/actions/filter.actions'


export default function useFilter() {
    const dispatch = useDispatch()

    const setPaymentsFilter = (filter) => { dispatch(filterActions.setPayments(filter)) } 
    const setInvoicesFilter = (filter) => { dispatch(filterActions.setInvouces(filter)) } 
    const setPoolFilter = (filter) => { dispatch(filterActions.setPool(filter)) } 

    const clearPaymentsFilter = () => { dispatch(filterActions.clearPayments()) }    
    const clearInvoicesFilter = () => { dispatch(filterActions.clearInvoices()) }
    const clearPoolFilter = () => { dispatch(filterActions.clearPool()) }

    const clear = () => {
        dispatch(filterActions.clearPayments())
        dispatch(filterActions.clearInvoices())
        dispatch(filterActions.clearPool())
    }

    return {
        setPaymentsFilter,
        setInvoicesFilter,
        setPoolFilter,

        clearPaymentsFilter,
        clearInvoicesFilter,
        clearPoolFilter,

        clear
    }
}