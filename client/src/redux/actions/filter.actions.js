import { SET_INVOICES, CLEAR_INVOICES } from '../types/filter.types'
import { SET_PAYMENTS, CLEAR_PAYMENTS } from '../types/filter.types'
import { SET_UNKNOWS, CLEAR_UNKNOWS } from '../types/filter.types'
import { SET_CARDS, CLEAR_CARDS } from '../types/filter.types'
import { SET_PARTNERS, CLEAR_PARTNERS } from '../types/filter.types'
import { SET_WORKERS, CLEAR_WORKERS } from '../types/filter.types'
import { SET_WITHDRAWS, CLEAR_WITHDRAWS } from '../types/filter.types'



export function setUnknows(filter) {
    return {
        type: SET_UNKNOWS,
        payload: filter
    }
}

export function clearUnknows() {
    return {
        type: CLEAR_UNKNOWS
    }
}

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

export function setCards(filter) {
    return {
        type: SET_CARDS,
        payload: filter
    }
}

export function clearCards() {
    return {
        type: CLEAR_CARDS
    }
}

export function setPartners(filter) {
    return {
        type: SET_PARTNERS,
        payload: filter
    }
}

export function clearPartners() {
    return {
        type: CLEAR_PARTNERS
    }
}

export function setWorkers(filter) {
    return {
        type: SET_WORKERS,
        payload: filter
    }
}

export function clearWorkers() {
    return {
        type: CLEAR_WORKERS
    }
}

export function setWithdraws(filter) {
    return {
        type: SET_WITHDRAWS,
        payload: filter
    }
}

export function clearWithdraws() {
    return {
        type: CLEAR_WITHDRAWS
    }
}