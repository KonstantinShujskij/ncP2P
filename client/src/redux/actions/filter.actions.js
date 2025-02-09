import { SET_INVOICES, CLEAR_INVOICES } from '../types/filter.types'
import { SET_PAYMENTS, CLEAR_PAYMENTS } from '../types/filter.types'


export function setPayments(filter) {
    return {
        type: SET_PAYMENTS,
        payload: filter
    }
}

export function clearPayments() {
    return {
        type: CLEAR_PAYMENTS
    }
}

export function setInvouces(filter) {
    return {
        type: SET_INVOICES,
        payload: filter
    }
}

export function clearInvoices() {
    return {
        type: CLEAR_INVOICES
    }
}
